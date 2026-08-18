import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

/**
 * DecompressionVFX — High-velocity atmospheric venting, directional ice crystals,
 * and particulate streams flowing toward the hull breach at [8.8, 3.5, 2.5].
 *
 * Three particle layers:
 *   1. Atmosphere vapor particles: white/blue fog wisps streaming toward breach
 *   2. Ice crystals: glinting frozen moisture fragments
 *   3. Micro-particulate dust: fine orange/amber dust motes entrained in the flow
 *
 * All particles reset to random interior positions and stream toward the breach
 * point, simulating rapid decompression airflow.
 */

const BREACH_TARGET = new THREE.Vector3(8.8, 3.5, 2.5);

const VAPOR_COUNT = 120;
const ICE_COUNT = 60;
const DUST_COUNT = 80;

// Seeded pseudo-random for deterministic placement
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

interface ParticlePool {
  positions: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  maxLifetimes: Float32Array;
  sizes: Float32Array;
}

function createParticlePool(count: number, seed: number, sizeMin: number, sizeMax: number): ParticlePool {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const lifetimes = new Float32Array(count);
  const maxLifetimes = new Float32Array(count);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const s = seed + i * 7;
    // Spawn at random positions within the station interior bounding box
    positions[i * 3] = (seededRandom(s) - 0.5) * 16;
    positions[i * 3 + 1] = seededRandom(s + 1) * 6 + 0.5;
    positions[i * 3 + 2] = (seededRandom(s + 2) - 0.5) * 14;

    lifetimes[i] = seededRandom(s + 3);  // stagger initial spawn
    maxLifetimes[i] = 1.5 + seededRandom(s + 4) * 2.5;
    sizes[i] = sizeMin + seededRandom(s + 5) * (sizeMax - sizeMin);
  }

  return { positions, velocities, lifetimes, maxLifetimes, sizes };
}

function resetParticle(pool: ParticlePool, idx: number, seed: number) {
  const s = seed + idx * 13 + pool.lifetimes[idx] * 100;
  pool.positions[idx * 3] = (seededRandom(s) - 0.5) * 14;
  pool.positions[idx * 3 + 1] = seededRandom(s + 1) * 5.5 + 0.5;
  pool.positions[idx * 3 + 2] = (seededRandom(s + 2) - 0.5) * 12;
  pool.lifetimes[idx] = 0;
  pool.maxLifetimes[idx] = 1.0 + seededRandom(s + 3) * 2.0;
}

export function DecompressionVFX() {
  const currentTime = useTimelineStore((s) => s.currentTime);

  // Particle geometry refs
  const vaporRef = useRef<THREE.Points>(null);
  const iceRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);

  // Particle data pools (deterministic)
  const vaporPool = useMemo(() => createParticlePool(VAPOR_COUNT, 1000, 0.08, 0.22), []);
  const icePool = useMemo(() => createParticlePool(ICE_COUNT, 2000, 0.03, 0.09), []);
  const dustPool = useMemo(() => createParticlePool(DUST_COUNT, 3000, 0.02, 0.05), []);

  // Create BufferGeometry attributes (only once)
  const vaporGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(vaporPool.positions, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(vaporPool.sizes, 1));
    return geom;
  }, [vaporPool]);

  const iceGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(icePool.positions, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(icePool.sizes, 1));
    return geom;
  }, [icePool]);

  const dustGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(dustPool.positions, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(dustPool.sizes, 1));
    return geom;
  }, [dustPool]);

  // Shader materials for atmospheric particles
  const vaporMaterial = useMemo(() => new THREE.PointsMaterial({
    color: '#bae6fd',
    size: 0.15,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  }), []);

  const iceMaterial = useMemo(() => new THREE.PointsMaterial({
    color: '#f0f9ff',
    size: 0.06,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  }), []);

  const dustMaterial = useMemo(() => new THREE.PointsMaterial({
    color: '#f59e0b',
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  }), []);

  useFrame((state, delta) => {
    if (currentTime < 78.0) {
      // Not decompressing yet — hide all particles
      if (vaporRef.current) vaporRef.current.visible = false;
      if (iceRef.current) iceRef.current.visible = false;
      if (dustRef.current) dustRef.current.visible = false;
      return;
    }

    if (vaporRef.current) vaporRef.current.visible = true;
    if (iceRef.current) iceRef.current.visible = true;
    if (dustRef.current) dustRef.current.visible = true;

    const severity = Math.min(1.0, (currentTime - 78.0) / 12.0);
    const baseSpeed = 3.5 + severity * 8.0; // Accelerating decompression
    const time = state.clock.getElapsedTime();

    // Update vapor particles — large soft atmosphere wisps streaming toward breach
    updateParticlePool(vaporPool, VAPOR_COUNT, delta, baseSpeed * 0.8, severity, time, 100);
    vaporGeom.attributes.position.needsUpdate = true;
    vaporMaterial.opacity = 0.45 * (1.0 - severity * 0.6); // Fade as atmosphere depletes

    // Update ice crystal particles — sharp fast frozen moisture
    updateParticlePool(icePool, ICE_COUNT, delta, baseSpeed * 1.2, severity, time, 200);
    iceGeom.attributes.position.needsUpdate = true;
    iceMaterial.opacity = 0.5 + severity * 0.4;

    // Update micro-particulate dust — fine motes entrained in airflow
    updateParticlePool(dustPool, DUST_COUNT, delta, baseSpeed * 0.6, severity, time, 300);
    dustGeom.attributes.position.needsUpdate = true;
    dustMaterial.opacity = 0.35 * severity;
  });

  return (
    <group name="decompression-vfx">
      {/* Atmosphere Vapor Stream */}
      <points ref={vaporRef} geometry={vaporGeom} material={vaporMaterial} />

      {/* Frozen Ice Crystals */}
      <points ref={iceRef} geometry={iceGeom} material={iceMaterial} />

      {/* Entrained Micro-Dust Particulate */}
      <points ref={dustRef} geometry={dustGeom} material={dustMaterial} />
    </group>
  );
}

function updateParticlePool(
  pool: ParticlePool,
  count: number,
  delta: number,
  speed: number,
  severity: number,
  time: number,
  seedOffset: number,
) {
  const dir = new THREE.Vector3();
  const pos = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    pool.lifetimes[i] += delta;

    // Reset particles that reached the breach or exceeded lifetime
    if (pool.lifetimes[i] > pool.maxLifetimes[i]) {
      resetParticle(pool, i, seedOffset + time * 10);
      continue;
    }

    pos.set(pool.positions[i * 3], pool.positions[i * 3 + 1], pool.positions[i * 3 + 2]);

    // Direction toward breach with turbulence
    dir.copy(BREACH_TARGET).sub(pos).normalize();

    // Add turbulent swirl
    const turbulence = 0.6 * severity;
    dir.x += Math.sin(time * 3.0 + i * 0.5) * turbulence * 0.3;
    dir.y += Math.cos(time * 2.5 + i * 0.7) * turbulence * 0.2;
    dir.z += Math.sin(time * 4.0 + i * 0.3) * turbulence * 0.25;
    dir.normalize();

    // Accelerate particles as they approach the breach (Venturi effect)
    const distToBreach = pos.distanceTo(BREACH_TARGET);
    const proximityBoost = 1.0 + Math.max(0, 1.0 - distToBreach / 10.0) * 2.0;

    const moveSpeed = speed * proximityBoost * delta * severity;
    pool.positions[i * 3] += dir.x * moveSpeed;
    pool.positions[i * 3 + 1] += dir.y * moveSpeed;
    pool.positions[i * 3 + 2] += dir.z * moveSpeed;

    // Reset if past breach
    if (distToBreach < 0.8) {
      resetParticle(pool, i, seedOffset + i + time * 5);
    }
  }
}
