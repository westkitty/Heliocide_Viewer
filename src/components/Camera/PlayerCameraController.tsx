import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import { useTimelineStore } from '../../store/timelineStore';

export function CameraManager() {
  const cameraMode = useTimelineStore((s) => s.cameraMode);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const accessibility = useTimelineStore((s) => s.accessibility);
  const { camera } = useThree();

  const moveKeys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false
  });

  const playerPos = useRef(new THREE.Vector3(0, 1.7, 2.0));
  const velocity = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    if (cameraMode === 'FIRST_PERSON') {
      // First Person Movement with Collision Clamping
      const speed = 4.5;
      const dir = new THREE.Vector3();
      const frontVector = new THREE.Vector3(0, 0, (moveKeys.current.backward ? 1 : 0) - (moveKeys.current.forward ? 1 : 0));
      const sideVector = new THREE.Vector3((moveKeys.current.right ? 1 : 0) - (moveKeys.current.left ? 1 : 0), 0, 0);

      dir.subVectors(frontVector, sideVector).normalize();
      dir.applyEuler(new THREE.Euler(0, camera.rotation.y, 0));

      velocity.current.x = dir.x * speed;
      velocity.current.z = dir.z * speed;

      playerPos.current.x += velocity.current.x * delta;
      playerPos.current.z += velocity.current.z * delta;

      // Station Collision Boundaries
      // Main hall: x: [-7.8, 7.8], z: [-6.5, 7.0]
      // Evac corridor: x: [-1.6, 1.6], z: [7.0, 13.0]
      if (playerPos.current.z > 7.0) {
        playerPos.current.x = THREE.MathUtils.clamp(playerPos.current.x, -1.6, 1.6);
        playerPos.current.z = THREE.MathUtils.clamp(playerPos.current.z, 7.0, 13.0);
      } else {
        playerPos.current.x = THREE.MathUtils.clamp(playerPos.current.x, -7.8, 7.8);
        playerPos.current.z = THREE.MathUtils.clamp(playerPos.current.z, -6.5, 7.0);
      }

      // Camera Shake during Heliocide / Cascade
      let shakeY = 0;
      let shakeX = 0;
      if (!accessibility.reducedMotion) {
        if (currentTime >= 52.0 && currentTime < 78.0) {
          const intensity = ((currentTime - 52.0) / 26.0) * 0.08;
          shakeY = (Math.random() - 0.5) * intensity;
          shakeX = (Math.random() - 0.5) * intensity;
        } else if (currentTime >= 78.0 && currentTime < 122.0) {
          shakeY = (Math.random() - 0.5) * 0.12;
          shakeX = (Math.random() - 0.5) * 0.12;
        }
      }

      camera.position.set(
        playerPos.current.x + shakeX,
        playerPos.current.y + shakeY,
        playerPos.current.z
      );
    } else if (cameraMode === 'CINEMATIC') {
      // Cinematic Camera for Station Loss (Phase G)
      const t = Math.min(1.0, (currentTime - 122.0) / 16.0);
      const radius = THREE.MathUtils.lerp(60, 20, t);
      const angle = currentTime * 0.2;
      camera.position.set(
        Math.cos(angle) * radius,
        15 - t * 25,
        Math.sin(angle) * radius - 40
      );
      camera.lookAt(0, -t * 20, -100);
    }
  });

  return (
    <>
      {cameraMode === 'FIRST_PERSON' && (
        <PointerLockControls />
      )}
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
