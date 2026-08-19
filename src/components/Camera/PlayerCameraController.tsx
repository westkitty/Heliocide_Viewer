import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import { useTimelineStore } from '../../store/timelineStore';

// Preallocate reusable scratch vectors for the frame loop to prevent GC churn
const _dir = new THREE.Vector3();
const _frontVector = new THREE.Vector3();
const _sideVector = new THREE.Vector3();
const _euler = new THREE.Euler();
const _targetLookAt = new THREE.Vector3();

// Simple pseudo-random hash for deterministic shake
function hash11(p: number) {
  p = (p * 0.1031) % 1;
  p *= p + 33.33;
  p *= p + p;
  return (p % 1);
}

export function CameraManager() {
  const cameraMode = useTimelineStore((s) => s.cameraMode);
    const accessibility = useTimelineStore((s) => s.accessibility);
  const { camera } = useThree();

  const moveKeys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  });

  const playerPos = useRef(new THREE.Vector3(0, 1.7, 2.0));
  const currentVelocity = useRef(new THREE.Vector3());
  const walkDistance = useRef(0);
  useEffect(() => {
    if (cameraMode === 'WALKTHROUGH') {
      playerPos.current.set(0, 1.7, 2.0);
      camera.position.set(0, 1.7, 2.0);
      camera.lookAt(0, 1.7, -100);
    }
  }, [cameraMode, camera]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
      if (cameraMode !== 'WALKTHROUGH') return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveKeys.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          moveKeys.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          moveKeys.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          moveKeys.current.right = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveKeys.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          moveKeys.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          moveKeys.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          moveKeys.current.right = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cameraMode]);

  useFrame((_, delta) => {
    const currentTime = useTimelineStore.getState().currentTime;
    // Dynamic Relativistic FOV Tuning
    if (camera instanceof THREE.PerspectiveCamera) {
      let targetFov = 70;
      if (currentTime >= 52.0 && currentTime < 78.0) {
        // Telephoto optical compression during catastrophic collapse
        const collapseT = (currentTime - 52.0) / 26.0;
        targetFov = THREE.MathUtils.lerp(70, 58, Math.sin(collapseT * Math.PI));
      } else if (currentTime >= 122.0) {
        // Wide-angle loss perspective during final station descent
        targetFov = THREE.MathUtils.lerp(70, 82, Math.min(1.0, (currentTime - 122.0) / 16.0));
      }
      if (Math.abs(camera.fov - targetFov) > 0.01) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
    }

    if (cameraMode === 'WALKTHROUGH') {
      // 1. Inertial acceleration and smooth deceleration
      const maxSpeed = 4.5;
      const accel = 12.0;
      const friction = 8.0;

      _frontVector.set(
        0,
        0,
        (moveKeys.current.backward ? 1 : 0) - (moveKeys.current.forward ? 1 : 0)
      );
      _sideVector.set(
        (moveKeys.current.right ? 1 : 0) - (moveKeys.current.left ? 1 : 0),
        0,
        0
      );

      _dir.subVectors(_frontVector, _sideVector).normalize();
      _euler.set(0, camera.rotation.y, 0);
      _dir.applyEuler(_euler);

      const targetVelX = _dir.x * maxSpeed;
      const targetVelZ = _dir.z * maxSpeed;

      currentVelocity.current.x = THREE.MathUtils.damp(
        currentVelocity.current.x,
        targetVelX,
        _dir.lengthSq() > 0 ? accel : friction,
        delta
      );
      currentVelocity.current.z = THREE.MathUtils.damp(
        currentVelocity.current.z,
        targetVelZ,
        _dir.lengthSq() > 0 ? accel : friction,
        delta
      );

      playerPos.current.x += currentVelocity.current.x * delta;
      playerPos.current.z += currentVelocity.current.z * delta;

      // Update footstep distance for head bobbing
      const speedMagnitude = Math.sqrt(
        currentVelocity.current.x ** 2 + currentVelocity.current.z ** 2
      );
      // Accumulate walk distance deterministically based on actual speed and delta
      walkDistance.current += speedMagnitude * delta;

      // Prevent wild accumulation if delta spikes during a frame drop
      if (delta > 0.1) walkDistance.current -= speedMagnitude * (delta - 0.1);

      // 2. Station Boundary Collision Clamping
      if (playerPos.current.z > 7.0) {
        playerPos.current.x = THREE.MathUtils.clamp(playerPos.current.x, -1.6, 1.6);
        playerPos.current.z = THREE.MathUtils.clamp(playerPos.current.z, 7.0, 13.0);
      } else {
        playerPos.current.x = THREE.MathUtils.clamp(playerPos.current.x, -7.8, 7.8);
        playerPos.current.z = THREE.MathUtils.clamp(playerPos.current.z, -6.5, 7.0);
      }

      // 3. Head Bobbing & Micro-Sway
      let bobY = 0;
      let bobX = 0;
      let swayY = 0;
      let swayX = 0;

      if (!accessibility.reducedMotion) {
        if (speedMagnitude > 0.1) {
          bobY = Math.sin(walkDistance.current * 7.0) * 0.035;
          bobX = Math.cos(walkDistance.current * 3.5) * 0.02;
        }
        // Organic idle breathing sway
        swayY = Math.sin(currentTime * 1.2) * 0.006;
        swayX = Math.cos(currentTime * 0.8) * 0.004;

        // 4. Catastrophic Multi-Harmonic Earthquake Camera Shake
        if (currentTime >= 52.0 && currentTime < 78.0) {
          const intensity = ((currentTime - 52.0) / 26.0) * 0.09;
          swayY += (Math.sin(currentTime * 45.0) * 0.5 + (hash11(currentTime * 100.0) - 0.5) * 0.5) * intensity;
          swayX += (Math.cos(currentTime * 38.0) * 0.5 + (hash11(currentTime * 100.0) - 0.5) * 0.5) * intensity;
        } else if (currentTime >= 78.0 && currentTime < 122.0) {
          const intensity = 0.14;
          swayY += (Math.sin(currentTime * 60.0) * 0.4 + (hash11(currentTime * 100.0) - 0.5) * 0.6) * intensity;
          swayX += (Math.cos(currentTime * 52.0) * 0.4 + (hash11(currentTime * 100.0) - 0.5) * 0.6) * intensity;
        }
      }

      camera.position.set(
        playerPos.current.x + bobX + swayX,
        playerPos.current.y + bobY + swayY,
        playerPos.current.z
      );

      if (typeof document !== 'undefined' && !document.pointerLockElement) {
        camera.rotation.set(0, 0, 0);
      }
    } else if (cameraMode === 'CINEMATIC') {
      // 5. Fully Authored Phase-Aware Cinematic Camera Director (0s - 138s)
      const targetPos = _frontVector;
      const lookTarget = _targetLookAt;

      if (currentTime < 14.0) {
        // Phase A: Nominal Baseline (0-14s) - Slow panoramic establishing track inside the deck
        const t = currentTime / 14.0;
        const smoothT = t * t * (3.0 - 2.0 * t);
        targetPos.set(
          THREE.MathUtils.lerp(3.2, -2.4, smoothT),
          THREE.MathUtils.lerp(2.1, 1.7, smoothT),
          THREE.MathUtils.lerp(4.0, 1.5, smoothT)
        );
        lookTarget.set(
          THREE.MathUtils.lerp(15.0, -10.0, smoothT),
          THREE.MathUtils.lerp(-4.0, 0.0, smoothT),
          -160
        );
      } else if (currentTime < 26.0) {
        // Phase B: Aureal Alert (14-26s) - Dramatic push towards the center observation glass
        const t = (currentTime - 14.0) / 12.0;
        const smoothT = t * t * (3.0 - 2.0 * t);
        targetPos.set(
          THREE.MathUtils.lerp(-2.4, 0.0, smoothT),
          THREE.MathUtils.lerp(1.7, 1.5, smoothT),
          THREE.MathUtils.lerp(1.5, -3.8, smoothT)
        );
        lookTarget.set(0, 0, -180);
      } else if (currentTime < 52.0) {
        // Phase C: Shard God Authority (26-52s) - Low-angle framing of initial Starsilk extraction
        const t = (currentTime - 26.0) / 26.0;
        const angle = t * Math.PI * 0.65;
        targetPos.set(
          Math.sin(angle) * 3.5,
          1.3 + Math.sin(t * Math.PI) * 0.4,
          -4.5 + Math.cos(angle) * 1.5
        );
        lookTarget.set(
          Math.sin(t * 4.0) * 8.0,
          2.0 + t * 4.0,
          -170
        );
      } else if (currentTime < 78.0) {
        // Phase D: Heliocide Collapse (52-78s) - Epic wide-angle pullback tracking massive Starsilk unspooling
        const t = (currentTime - 52.0) / 26.0;
        const smoothT = Math.pow(t, 0.8);
        const shake = Math.sin(currentTime * 40.0) * 0.08 * (1.0 - t * 0.5);
        targetPos.set(
          THREE.MathUtils.lerp(0.0, -1.8, smoothT) + shake,
          THREE.MathUtils.lerp(1.5, 2.2, smoothT) + shake,
          THREE.MathUtils.lerp(-3.8, 1.0, smoothT)
        );
        lookTarget.set(
          Math.sin(currentTime * 0.3) * 6.0,
          -t * 3.0,
          -180
        );
      } else if (currentTime < 104.0) {
        // Phase E: Cluster Cascade & Hull Breach (78-104s) - Dynamic framing near the breach and spiraling silk
        const t = (currentTime - 78.0) / 26.0;
        const smoothT = t * t * (3.0 - 2.0 * t);
        const breachShake = Math.sin(currentTime * 50.0) * 0.12 * Math.sin(t * Math.PI);
        targetPos.set(
          THREE.MathUtils.lerp(2.5, 5.5, smoothT) + breachShake,
          THREE.MathUtils.lerp(1.8, 2.8, smoothT) + breachShake,
          THREE.MathUtils.lerp(0.0, 3.5, smoothT)
        );
        lookTarget.set(
          THREE.MathUtils.lerp(-10.0, 15.0, smoothT),
          THREE.MathUtils.lerp(2.0, -4.0, smoothT),
          -160
        );
      } else if (currentTime < 122.0) {
        // Phase F: Siege Wall Emergence (104-122s) - Exterior sweeping shot tracking tearing station and void horizon
        const t = (currentTime - 104.0) / 18.0;
        const smoothT = t * t * (3.0 - 2.0 * t);
        const orbitRadius = THREE.MathUtils.lerp(18.0, 38.0, smoothT);
        const orbitAngle = t * Math.PI * 0.75 - 0.5;
        targetPos.set(
          Math.sin(orbitAngle) * orbitRadius,
          THREE.MathUtils.lerp(4.0, 18.0, smoothT),
          Math.cos(orbitAngle) * orbitRadius - 15.0
        );
        lookTarget.set(0, -6.0, -140);
      } else {
        // Phase G: Station Loss & Containment (122-138s) - Majestic cosmic orbit around final contained singularity
        const t = Math.min(1.0, (currentTime - 122.0) / 16.0);
        const smoothT = t * t * (3.0 - 2.0 * t);
        const radius = THREE.MathUtils.lerp(42.0, 60.0, smoothT);
        const angle = currentTime * 0.12;

        targetPos.set(
          Math.cos(angle) * radius,
          THREE.MathUtils.lerp(18.0, 8.0, smoothT),
          Math.sin(angle) * radius - 60.0
        );
        lookTarget.set(0, -t * 12.0, -160);
      }

      // Smoothly damp camera position and orientation to eliminate jitter
      camera.position.lerp(targetPos, Math.min(1.0, delta * 4.5));
      camera.lookAt(lookTarget);
    }
  });

  const orbitRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow pressing 'R' to recenter
      if (e.key === 'r' || e.key === 'R') {
        if (orbitRef.current) {
          orbitRef.current.target.set(0, 0, -100);
          orbitRef.current.update();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {cameraMode === 'WALKTHROUGH' && <PointerLockControls />}
      {(cameraMode === 'OBSERVATION' || cameraMode === 'FORENSIC_REPLAY') && (
        <OrbitControls
          ref={orbitRef}
          makeDefault
          enableDamping
          enablePan={true}
          enableZoom={true}
          dampingFactor={0.08}
          minDistance={1}
          maxDistance={400}
          target={[0, 0, -100]} // Look out towards the star event
        />
      )}
    </>
  );
}
