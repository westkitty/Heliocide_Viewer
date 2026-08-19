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
  const smoothedLookAt = useRef(new THREE.Vector3(0, 0, -100));
  useEffect(() => {
    if (cameraMode === 'FIRST_PERSON') {
      playerPos.current.set(0, 1.7, 2.0);
      camera.position.set(0, 1.7, 2.0);
      camera.lookAt(0, 1.7, -100);
    }
  }, [cameraMode, camera]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
      if (cameraMode !== 'FIRST_PERSON') return;
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
      const nextFov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 3.0);
      if (Math.abs(camera.fov - nextFov) > 0.01) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    }

    if (cameraMode === 'FIRST_PERSON') {
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
      walkDistance.current += speedMagnitude * delta;

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
      // 5. Authored Cinematic Flight Arc & Damped LookAt
      const t = Math.min(1.0, (currentTime - 122.0) / 16.0);
      const radius = THREE.MathUtils.lerp(65, 22, Math.sqrt(t));
      const angle = currentTime * 0.18;
      
      const targetCamX = Math.cos(angle) * radius;
      const targetCamY = 16 - t * 28;
      const targetCamZ = Math.sin(angle) * radius - 45;

      camera.position.set(
        THREE.MathUtils.damp(camera.position.x, targetCamX, 4.0, delta),
        THREE.MathUtils.damp(camera.position.y, targetCamY, 4.0, delta),
        THREE.MathUtils.damp(camera.position.z, targetCamZ, 4.0, delta)
      );

      _targetLookAt.set(0, -t * 22, -100);
      smoothedLookAt.current.lerp(_targetLookAt, delta * 3.5);
      camera.lookAt(smoothedLookAt.current);
    }
  });

  return (
    <>
      {cameraMode === 'FIRST_PERSON' && <PointerLockControls />}
      {(cameraMode === 'EXTERIOR_INSPECTION' || cameraMode === 'ORBIT_OBSERVATORY') && (
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={15}
          maxDistance={400}
        />
      )}
    </>
  );
}
