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
    float dayFactor = smoothstep(-0.15, 0.25, NdotL);
    float nightFactor = 1.0 - dayFactor;

    // Sample textures
    vec4 surface = texture2D(uSurfaceMap, vUv);
    vec4 night = texture2D(uNightMap, vUv);
    vec4 clouds = texture2D(uCloudMap, vUv);

    // Ocean Specular Glint on Sunward side (ocean is deep blue surface.b > 0.35)
    float isOcean = smoothstep(0.18, 0.35, surface.b - surface.g);
    vec3 halfVec = normalize(sunDir + viewDir);
    float NdotH = max(0.0, dot(normal, halfVec));
    float specular = pow(NdotH, 64.0) * isOcean * dayFactor * 1.8;

    // Direct warm solar illumination (5800K)
    vec3 sunColor = vec3(1.0, 0.95, 0.88);
    vec3 ambientSpace = vec3(0.015, 0.02, 0.035);

    vec3 daySurface = mix(surface.rgb, clouds.rgb, clouds.a * 0.75);
    vec3 dayLit = daySurface * (max(0.0, NdotL) * sunColor + ambientSpace) + vec3(specular);

    // Night hemisphere: City lights only illuminate in true night, blacking out during collapse
    vec3 nightLit = night.rgb * (1.0 - uCityBlackout) * nightFactor * 2.2 + ambientSpace * 0.5;

    // Atmospheric Rayleigh scattering rim on illuminated limb
    float rim = 1.0 - max(0.0, dot(normal, viewDir));
    vec3 atmosGlow = vec3(0.22, 0.55, 0.95) * pow(rim, 3.5) * (dayFactor * 1.5 + 0.15);

    vec3 finalColor = mix(nightLit, dayLit, dayFactor) + atmosGlow;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function InhabitedPlanet() {
  const planetGroupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { planetTexture, nightTexture, cloudTexture } = useMemo(() => {
    // Surface texture canvas
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 1024;
    pCanvas.height = 512;
    const pCtx = pCanvas.getContext('2d')!;
    
    pCtx.fillStyle = '#0a2239';
    pCtx.fillRect(0, 0, 1024, 512);

    // Continents
    pCtx.fillStyle = '#1e5128';
    for (let i = 0; i < 40; i++) {
      const cx = (i * 27) % 1024;
      const cy = 100 + (i * 37) % 312;
      const r = 30 + (i * 13) % 70;
      pCtx.beginPath();
      pCtx.arc(cx, cy, r, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.beginPath();
      pCtx.arc(cx + r * 0.5, cy + r * 0.3, r * 0.6, 0, Math.PI * 2);
      pCtx.fill();
    }
    // High-altitude mountain ridges
    pCtx.fillStyle = '#5c6370';
    for (let i = 0; i < 20; i++) {
      const cx = (i * 53 + 120) % 1024;
      const cy = 140 + (i * 29) % 230;
      pCtx.beginPath();
      pCtx.arc(cx, cy, 18, 0, Math.PI * 2);
      pCtx.fill();
    }

    // Night city lights
    const nCanvas = document.createElement('canvas');
    nCanvas.width = 1024;
    nCanvas.height = 512;
    const nCtx = nCanvas.getContext('2d')!;
    nCtx.fillStyle = '#000000';
    nCtx.fillRect(0, 0, 1024, 512);
    nCtx.fillStyle = '#ffcf70';
    for (let i = 0; i < 700; i++) {
      const x = Math.floor((Math.sin(i * 99) * 0.5 + 0.5) * 1024);
      const y = Math.floor((Math.cos(i * 77) * 0.35 + 0.5) * 512);
      nCtx.fillRect(x, y, 2, 2);
      if (i % 4 === 0) {
        nCtx.fillStyle = '#06d6a0';
        nCtx.fillRect(x, y, 3, 3);
        nCtx.fillStyle = '#ffcf70';
      }
    }

    // Cloud cover canvas
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 1024;
    cCanvas.height = 512;
    const cCtx = cCanvas.getContext('2d')!;
    cCtx.fillStyle = 'rgba(0,0,0,0)';
    cCtx.fillRect(0, 0, 1024, 512);
    cCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 90; i++) {
      const cx = (i * 43) % 1024;
      const cy = (i * 23) % 512;
      cCtx.beginPath();
      cCtx.ellipse(cx, cy, 55, 18, 0.25, 0, Math.PI * 2);
      cCtx.fill();
    }

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

    // City lights blackout calculation
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

    // Orbital decay during catastrophe
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
