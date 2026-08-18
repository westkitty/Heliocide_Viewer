import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

const PlanetVertexShader = `
  uniform vec3 uStarPosition;
  uniform float uTidalStripping;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    
    // Prolate tidal bulge stretching toward the gravitational singularity
    if (uTidalStripping > 0.001) {
      vec3 toBH = normalize(uStarPosition - worldPos.xyz);
      vec3 wNorm = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      float tidalFactor = pow(max(0.0, dot(wNorm, toBH)), 2.0) * 1.8 * uTidalStripping;
      worldPos.xyz += toBH * tidalFactor;
    }

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
  uniform float uCloudOffset;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  const float PI = 3.14159265359;

  float D_GGX(float NdotH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH2 = NdotH * NdotH;
    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
    return num / max(denom, 0.0001);
  }

  float G_SchlickSmithGGX(float NdotL, float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    float numL = NdotL;
    float denomL = NdotL * (1.0 - k) + k;
    float numV = NdotV;
    float denomV = NdotV * (1.0 - k) + k;
    return (numL / max(denomL, 0.0001)) * (numV / max(denomV, 0.0001));
  }

  vec3 F_Schlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
  }

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 L = normalize(uStarPosition - vWorldPosition);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    vec3 H = normalize(L + V);

    float rawNdotL = dot(N, L);
    float dayFactor = smoothstep(-0.10, 0.10, rawNdotL);

    float NdotL = max(0.0, rawNdotL);
    float NdotV = max(0.001, dot(N, V));
    float NdotH = max(0.0, dot(N, H));
    float VdotH = max(0.0, dot(V, H));

    vec4 surface = texture2D(uSurfaceMap, vUv);
    vec4 night = texture2D(uNightMap, vUv);

    vec2 cloudUv = vec2(vUv.x + uCloudOffset, vUv.y);
    vec2 shadowUv = cloudUv + normalize(L.xy) * 0.008;
    vec4 shadowCloud = texture2D(uCloudMap, shadowUv);
    float cloudShadow = 1.0 - shadowCloud.a * 0.65 * dayFactor;

    vec3 albedo = surface.rgb;
    float roughness = clamp(surface.a, 0.04, 0.95);

    bool isOcean = roughness < 0.15;
    vec3 F0 = isOcean ? vec3(0.02) : vec3(0.04);

    float NDF = D_GGX(NdotH, roughness);
    float G = G_SchlickSmithGGX(NdotL, NdotV, roughness);
    vec3 F = F_Schlick(VdotH, F0);

    vec3 kS = F;
    vec3 kD = (vec3(1.0) - kS) * (isOcean ? 0.2 : 1.0);

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.0001;
    vec3 specularBRDF = numerator / denominator;

    vec3 middaySun = vec3(1.0, 0.96, 0.90) * 2.8;
    vec3 sunsetSun = vec3(1.0, 0.38, 0.10) * 2.2;
    float sunsetFactor = smoothstep(-0.06, 0.18, rawNdotL) * (1.0 - smoothstep(0.08, 0.45, rawNdotL));
    vec3 incidentSunColor = mix(middaySun, sunsetSun, sunsetFactor);

    vec3 ambientSpace = vec3(0.012, 0.016, 0.025);

    vec3 diffuse = (kD * albedo / PI);
    vec3 directLight = (diffuse + specularBRDF) * incidentSunColor * NdotL * cloudShadow;

    vec3 dayLit = directLight;
    float cityActivation = smoothstep(0.06, -0.06, rawNdotL);
    vec3 nightLit = night.rgb * (1.0 - uCityBlackout) * cityActivation * 2.6 + ambientSpace;

    float rim = 1.0 - max(0.0, dot(N, V));
    vec3 rayleighSky = vec3(0.18, 0.58, 1.0);
    vec3 sunsetRim = vec3(1.0, 0.45, 0.15);
    vec3 atmosColor = mix(rayleighSky, sunsetRim, sunsetFactor);
    vec3 atmosGlow = atmosColor * pow(rim, 3.2) * (dayFactor * 1.8 + 0.15);

    vec3 finalColor = mix(nightLit, dayLit, dayFactor) + atmosGlow;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const CloudVertexShader = `
  uniform vec3 uStarPosition;
  uniform float uTidalStripping;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);

    if (uTidalStripping > 0.001) {
      vec3 toBH = normalize(uStarPosition - worldPos.xyz);
      vec3 wNorm = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      float tidalFactor = pow(max(0.0, dot(wNorm, toBH)), 2.0) * 2.5 * uTidalStripping;
      worldPos.xyz += toBH * tidalFactor;
    }

    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const CloudFragmentShader = `
  uniform sampler2D uCloudMap;
  uniform vec3 uStarPosition;
  uniform float uCloudOffset;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 L = normalize(uStarPosition - vWorldPosition);
    vec3 V = normalize(cameraPosition - vWorldPosition);

    vec2 animatedUv = vec2(vUv.x + uCloudOffset, vUv.y);
    vec4 cloudSample = texture2D(uCloudMap, animatedUv);
    if (cloudSample.a < 0.05) discard;

    float rawNdotL = dot(N, L);
    float NdotL = max(0.0, rawNdotL);
    float dayFactor = smoothstep(-0.10, 0.10, rawNdotL);

    float cosTheta = dot(V, L);
    float forwardScatter = pow(max(0.0, cosTheta), 4.0) * 0.45;

    vec3 middaySun = vec3(1.0, 0.98, 0.94) * 2.6;
    vec3 sunsetSun = vec3(1.0, 0.45, 0.18) * 2.2;
    float sunsetFactor = smoothstep(-0.06, 0.18, rawNdotL) * (1.0 - smoothstep(0.08, 0.45, rawNdotL));
    vec3 sunLight = mix(middaySun, sunsetSun, sunsetFactor);

    vec3 ambientGlow = vec3(0.08, 0.12, 0.22);
    vec3 cloudLit = (NdotL + forwardScatter) * sunLight + ambientGlow;

    vec3 finalColor = cloudSample.rgb * cloudLit;
    float alpha = cloudSample.a * (dayFactor * 0.9 + 0.1);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const AtmosphereVertexShader = `
  uniform vec3 uStarPosition;
  uniform float uTidalStripping;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);

    // Severe atmospheric stripping elongation
    if (uTidalStripping > 0.001) {
      vec3 toBH = normalize(uStarPosition - worldPos.xyz);
      vec3 wNorm = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      float tidalFactor = pow(max(0.0, dot(wNorm, toBH)), 1.5) * 5.5 * uTidalStripping;
      worldPos.xyz += toBH * tidalFactor;
    }

    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const AtmosphereFragmentShader = `
  uniform vec3 uStarPosition;
  uniform float uTidalStripping;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 L = normalize(uStarPosition - vWorldPosition);
    vec3 V = normalize(cameraPosition - vWorldPosition);

    float NdotL = dot(N, L);
    float NdotV = dot(N, V);
    float rim = 1.0 - max(0.0, NdotV);

    float cosTheta = dot(-V, L);
    float rayleighPhase = 0.75 * (1.0 + cosTheta * cosTheta);

    float g = 0.76;
    float miePhase = (1.0 - g * g) / (4.0 * 3.14159 * pow(max(0.01, 1.0 + g * g - 2.0 * g * cosTheta), 1.5));

    float dayFactor = smoothstep(-0.15, 0.25, NdotL);
    float sunsetFactor = smoothstep(-0.10, 0.18, NdotL) * (1.0 - smoothstep(0.08, 0.45, NdotL));

    vec3 rayleighColor = vec3(0.15, 0.55, 1.0);
    vec3 sunsetColor = vec3(1.0, 0.42, 0.12);
    vec3 strippingColor = vec3(0.0, 0.95, 1.0); // Ionized ripped exosphere plasma
    
    vec3 atmosBase = mix(rayleighColor, sunsetColor, sunsetFactor);
    atmosBase = mix(atmosBase, strippingColor, uTidalStripping * 0.75);

    float intensity = pow(rim, 3.8) * (rayleighPhase * 1.2 + miePhase * 0.8) * (dayFactor * 2.2 + 0.1);
    intensity += uTidalStripping * max(0.0, dot(N, L)) * 1.8;

    vec3 finalColor = atmosBase * intensity;
    float alpha = clamp(pow(rim, 2.5) * (dayFactor * 0.95 + 0.08) + uTidalStripping * 0.35, 0.0, 1.0);
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

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
  const cloudMeshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const cloudMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const atmosMaterialRef = useRef<THREE.ShaderMaterial>(null);

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

    const pCanvas = document.createElement('canvas');
    pCanvas.width = width;
    pCanvas.height = height;
    const pCtx = pCanvas.getContext('2d')!;
    const pImg = pCtx.createImageData(width, height);
    const pData = pImg.data;

    const nCanvas = document.createElement('canvas');
    nCanvas.width = width;
    nCanvas.height = height;
    const nCtx = nCanvas.getContext('2d')!;
    const nImg = nCtx.createImageData(width, height);
    const nData = nImg.data;

    const cCanvas = document.createElement('canvas');
    cCanvas.width = width;
    cCanvas.height = height;
    const cCtx = cCanvas.getContext('2d')!;
    const cImg = cCtx.createImageData(width, height);
    const cData = cImg.data;

    for (let py = 0; py < height; py++) {
      const lat = (py / height) * Math.PI - Math.PI / 2;
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);
      const absLat = Math.abs(lat);

      for (let px = 0; px < width; px++) {
        const lon = (px / width) * Math.PI * 2;
        const idx = (py * width + px) * 4;

        const sx = cosLat * Math.cos(lon) * 2.5;
        const sy = cosLat * Math.sin(lon) * 2.5;
        const sz = sinLat * 2.5;

        const elevation = fbm(sx + 10.0, sy + sz + 10.0, 7) + 0.08 - absLat * 0.15;
        const mountainNoise = Math.pow(Math.abs(fbm(sx * 2.0 + sz * 1.5 + 30.0, sy * 2.0 + 30.0, 5)), 2.0) * 0.6;
        const totalElev = elevation + (elevation > 0.05 ? mountainNoise : 0);

        let r = 0, g = 0, b = 0, roughness = 0.8;

        if (totalElev < -0.15) {
          r = 6; g = 22; b = 58;
          roughness = 0.04;
        } else if (totalElev < 0.0) {
          const depthT = (totalElev + 0.15) / 0.15;
          r = Math.floor(THREE.MathUtils.lerp(6, 18, depthT));
          g = Math.floor(THREE.MathUtils.lerp(22, 68, depthT));
          b = Math.floor(THREE.MathUtils.lerp(58, 110, depthT));
          roughness = 0.06;
        } else if (absLat > 1.25) {
          r = 230; g = 242; b = 255;
          roughness = 0.22;
        } else if (totalElev < 0.04) {
          r = 42; g = 98; b = 54;
          roughness = 0.72;
        } else if (totalElev < 0.22) {
          r = 30; g = 82; b = 38;
          roughness = 0.85;
        } else if (totalElev < 0.38) {
          r = 142; g = 118; b = 78;
          roughness = 0.92;
        } else {
          const peakT = (totalElev - 0.38) / 0.3;
          r = Math.floor(THREE.MathUtils.lerp(120, 240, peakT));
          g = Math.floor(THREE.MathUtils.lerp(120, 245, peakT));
          b = Math.floor(THREE.MathUtils.lerp(130, 255, peakT));
          roughness = 0.95;
        }

        pData[idx] = r;
        pData[idx + 1] = g;
        pData[idx + 2] = b;
        pData[idx + 3] = Math.floor(roughness * 255);

        const coastalBelt = Math.abs(totalElev - 0.02) < 0.03;
        const megaCityDensity = fbm(sx * 10.0 + 5.0, sy * 10.0 + sz * 8.0, 4);
        const transportArtery = Math.pow(Math.abs(fbm(sx * 22.0, sy * 22.0 + sz * 15.0, 3)), 8.0) * 8.0;

        let nr = 0, ng = 0, nb = 0;

        if (totalElev >= -0.02 && totalElev < 0.28 && absLat < 1.15) {
          if (megaCityDensity > 0.22) {
            const coreIntensity = smoothstep(0.22, 0.45, megaCityDensity);
            nr = Math.floor(THREE.MathUtils.lerp(210, 255, coreIntensity));
            ng = Math.floor(THREE.MathUtils.lerp(140, 210, coreIntensity));
            nb = Math.floor(THREE.MathUtils.lerp(40, 110, coreIntensity));
          } else if (transportArtery > 0.4 || (coastalBelt && megaCityDensity > 0.08)) {
            nr = 245; ng = 158; nb = 35;
          } else if (fbm(sx * 35.0, sy * 35.0, 2) > 0.42) {
            nr = 180; ng = 110; nb = 25;
          }
        } else if (totalElev < -0.02 && totalElev > -0.08 && absLat < 0.95) {
          if (fbm(sx * 18.0 + 88.0, sy * 18.0, 3) > 0.38) {
            nr = 14; ng = 240; nb = 220;
          }
        }

        nData[idx] = nr;
        nData[idx + 1] = ng;
        nData[idx + 2] = nb;
        nData[idx + 3] = 255;

        const coriolisShear = Math.sin(lat * 3.0) * 0.8;
        const cloudNoise1 = fbm(sx * 1.8 + coriolisShear, sy * 1.8 + sz * 1.2, 5);
        const cycloneCore = Math.pow(Math.abs(fbm(sx * 3.5 + 40.0, sy * 3.5 + sz * 2.0, 4)), 1.5);
        const cloudTotal = cloudNoise1 * 0.75 + cycloneCore * 0.4;
        const cloudDensity = smoothstep(0.12, 0.42, cloudTotal);

        cData[idx] = 255;
        cData[idx + 1] = 255;
        cData[idx + 2] = 255;
        cData[idx + 3] = Math.floor(cloudDensity * 225);
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
    uCityBlackout: { value: 0 },
    uCloudOffset: { value: 0 },
    uTidalStripping: { value: 0 }
  }), [planetTexture, nightTexture, cloudTexture]);

  const cloudUniforms = useMemo(() => ({
    uCloudMap: { value: cloudTexture },
    uStarPosition: { value: new THREE.Vector3(0, 0, -180) },
    uCloudOffset: { value: 0 },
    uTidalStripping: { value: 0 }
  }), [cloudTexture]);

  const atmosUniforms = useMemo(() => ({
    uStarPosition: { value: new THREE.Vector3(0, 0, -180) },
    uTidalStripping: { value: 0 }
  }), []);

  useFrame((_, delta) => {
    if (!planetGroupRef.current || !materialRef.current || !cloudMaterialRef.current || !atmosMaterialRef.current) return;

    planetGroupRef.current.rotation.y += delta * 0.015;

    uniforms.uCloudOffset.value += delta * 0.008;
    cloudUniforms.uCloudOffset.value += delta * 0.008;

    const currentTime = useTimelineStore.getState().currentTime;
    materialRef.current.uniforms.uCurrentTime.value = currentTime;

    let blackout = 0;
    let tidal = 0;

    if (currentTime < 52.0) {
      blackout = 0;
      tidal = 0;
    } else if (currentTime < 78.0) {
      const t = (currentTime - 52.0) / 26.0;
      const flicker = Math.sin(currentTime * 25.0) > 0 ? 0.3 : 0.9;
      blackout = Math.min(1.0, t * flicker + t * 0.5);
      tidal = t * 0.65;
    } else {
      blackout = 1.0;
      const postT = Math.min(1.0, (currentTime - 78.0) / 40.0);
      tidal = THREE.MathUtils.lerp(0.65, 1.0, postT);
    }

    materialRef.current.uniforms.uCityBlackout.value = blackout;
    materialRef.current.uniforms.uTidalStripping.value = tidal;
    cloudMaterialRef.current.uniforms.uTidalStripping.value = tidal;
    atmosMaterialRef.current.uniforms.uTidalStripping.value = tidal;

    if (currentTime < 52.0) {
      planetGroupRef.current.position.set(65, -25, -120);
      planetGroupRef.current.rotation.x = 0;
      planetGroupRef.current.rotation.z = 0.05;
    } else if (currentTime < 78.0) {
      const t = (currentTime - 52.0) / 26.0;
      const orbitalDriftX = 65 + Math.sin(currentTime * 0.25) * 3.5 * t;
      const orbitalDriftY = -25 - t * 8.0;
      const orbitalDriftZ = -120 - t * 14.0;
      planetGroupRef.current.position.set(orbitalDriftX, orbitalDriftY, orbitalDriftZ);

      planetGroupRef.current.rotation.x = Math.sin(currentTime * 1.8) * 0.06 * t;
      planetGroupRef.current.rotation.z = 0.05 + t * 0.28 + Math.cos(currentTime * 1.4) * 0.04 * t;
    } else {
      const postT = Math.min(1.0, (currentTime - 78.0) / 50.0);
      const orbitalDriftX = 65 + Math.sin(78.0 * 0.25) * 3.5 - postT * 12.0;
      const orbitalDriftY = -33.0 - postT * 22.0;
      const orbitalDriftZ = -134.0 - postT * 28.0;
      planetGroupRef.current.position.set(orbitalDriftX, orbitalDriftY, orbitalDriftZ);

      planetGroupRef.current.rotation.x = 0.06 + Math.sin(currentTime * 0.8) * 0.03;
      planetGroupRef.current.rotation.z = 0.33 + postT * 0.15;
    }
  });

  return (
    <group ref={planetGroupRef} position={[65, -25, -120]}>
      {/* 1. Physically-Shaded Surface with Tidal Bulge Deformation */}
      <mesh>
        <sphereGeometry args={[24, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={PlanetVertexShader}
          fragmentShader={PlanetFragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* 2. Independent Advecting Cloud Layer with Tidal Drag */}
      <mesh ref={cloudMeshRef}>
        <sphereGeometry args={[24.25, 64, 64]} />
        <shaderMaterial
          ref={cloudMaterialRef}
          vertexShader={CloudVertexShader}
          fragmentShader={CloudFragmentShader}
          uniforms={cloudUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* 3. Volumetric Rayleigh & Mie Atmospheric Scattering with Tidal Stripping Elongation */}
      <mesh>
        <sphereGeometry args={[24.8, 64, 64]} />
        <shaderMaterial
          ref={atmosMaterialRef}
          vertexShader={AtmosphereVertexShader}
          fragmentShader={AtmosphereFragmentShader}
          uniforms={atmosUniforms}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
