import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

export function InhabitedPlanet() {
  const planetRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const cityMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const currentTime = useTimelineStore((s) => s.currentTime);

  // Generate procedural earth-like procedural textures for planet and night city lights
  const { planetTexture, nightTexture, cloudTexture } = useMemo(() => {
    // Planet surface canvas
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 1024;
    pCanvas.height = 512;
    const pCtx = pCanvas.getContext('2d')!;
    
    // Ocean base
    pCtx.fillStyle = '#0f2744';
    pCtx.fillRect(0, 0, 1024, 512);

    // Procedural continent landmasses
    pCtx.fillStyle = '#1e4d2b';
    for (let i = 0; i < 40; i++) {
      const cx = (i * 27) % 1024;
      const cy = 100 + (i * 37) % 312;
      const r = 30 + (i * 13) % 70;
      pCtx.beginPath();
      pCtx.arc(cx, cy, r, 0, Math.PI * 2);
      pCtx.fill();
      // Sub-blobs
      pCtx.beginPath();
      pCtx.arc(cx + r * 0.5, cy + r * 0.3, r * 0.6, 0, Math.PI * 2);
      pCtx.fill();
    }
    // High-altitude mountain ridges
    pCtx.fillStyle = '#6b7280';
    for (let i = 0; i < 20; i++) {
      const cx = (i * 53 + 120) % 1024;
      const cy = 140 + (i * 29) % 230;
      pCtx.beginPath();
      pCtx.arc(cx, cy, 18, 0, Math.PI * 2);
      pCtx.fill();
    }

    // Night city lights canvas
    const nCanvas = document.createElement('canvas');
    nCanvas.width = 1024;
    nCanvas.height = 512;
    const nCtx = nCanvas.getContext('2d')!;
    nCtx.fillStyle = '#000000';
    nCtx.fillRect(0, 0, 1024, 512);
    nCtx.fillStyle = '#ffd166';
    for (let i = 0; i < 600; i++) {
      const x = Math.floor((Math.sin(i * 99) * 0.5 + 0.5) * 1024);
      const y = Math.floor((Math.cos(i * 77) * 0.35 + 0.5) * 512);
      nCtx.fillRect(x, y, 2, 2);
      if (i % 5 === 0) {
        nCtx.fillStyle = '#06d6a0';
        nCtx.fillRect(x, y, 3, 3);
        nCtx.fillStyle = '#ffd166';
      }
    }

    // Clouds canvas
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 1024;
    cCanvas.height = 512;
    const cCtx = cCanvas.getContext('2d')!;
    cCtx.fillStyle = 'rgba(0,0,0,0)';
    cCtx.fillRect(0, 0, 1024, 512);
    cCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let i = 0; i < 70; i++) {
      const cx = (i * 43) % 1024;
      const cy = (i * 23) % 512;
      cCtx.beginPath();
      cCtx.ellipse(cx, cy, 60, 20, 0.2, 0, Math.PI * 2);
      cCtx.fill();
    }

    const pTex = new THREE.CanvasTexture(pCanvas);
    const nTex = new THREE.CanvasTexture(nCanvas);
    const cTex = new THREE.CanvasTexture(cCanvas);
    return { planetTexture: pTex, nightTexture: nTex, cloudTexture: cTex };
  }, []);

  useFrame((_, delta) => {
    if (!planetRef.current) return;

    // Slow orbital rotation
    planetRef.current.rotation.y += delta * 0.02;

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.028;
    }

    // Night city lights blackout during collapse
    if (cityMatRef.current) {
      if (currentTime < 52.0) {
        cityMatRef.current.opacity = 0.85;
      } else if (currentTime < 78.0) {
        const t = (currentTime - 52.0) / 26.0;
        // Flickering failure
        const flicker = Math.sin(currentTime * 25.0) > 0 ? 0.3 : 0.8;
        cityMatRef.current.opacity = Math.max(0, (1.0 - t) * flicker);
      } else {
        cityMatRef.current.opacity = 0.0;
      }
    }

    // Gravitational orbital decay tilt during Phase E & F
    if (currentTime > 78.0) {
      const decay = Math.min(1.0, (currentTime - 78.0) / 40.0);
      planetRef.current.position.y = -25 - decay * 15;
      planetRef.current.rotation.z = decay * 0.4;
    } else {
      planetRef.current.position.y = -25;
      planetRef.current.rotation.z = 0.05;
    }
  });

  return (
    <group ref={planetRef} position={[65, -25, -120]}>
      {/* Surface Mesh */}
      <mesh>
        <sphereGeometry args={[24, 64, 64]} />
        <meshStandardMaterial
          map={planetTexture}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Night City Lights (Emissive overlay) */}
      <mesh>
        <sphereGeometry args={[24.05, 64, 64]} />
        <meshBasicMaterial
          ref={cityMatRef}
          map={nightTexture}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[24.25, 48, 48]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric Rim Glow */}
      <mesh scale={1.05}>
        <sphereGeometry args={[24, 32, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
