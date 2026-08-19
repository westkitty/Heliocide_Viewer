const fs = require('fs');
let code = fs.readFileSync('src/components/Camera/PlayerCameraController.tsx', 'utf8');

// Replace module-level to include static vectors
const topInsert = `import { useRef, useEffect } from 'react';
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

export function CameraManager() {`;

code = code.replace(/import \{ useRef, useEffect \}.*?export function CameraManager\(\) \{/s, topInsert);

// Fix useFrame body
code = code.replace(/const dir = new THREE\.Vector3\(\);[\s\S]*?dir\.applyEuler\(new THREE\.Euler\(0, camera\.rotation\.y, 0\)\);/, 
`_frontVector.set(
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
      _dir.applyEuler(_euler);`);

// Fix targetVel
code = code.replace(/const targetVelX = dir\.x \* maxSpeed;\n      const targetVelZ = dir\.z \* maxSpeed;/,
`const targetVelX = _dir.x * maxSpeed;
      const targetVelZ = _dir.z * maxSpeed;`);

// Fix dir lengthSq check
code = code.replace(/dir\.lengthSq\(\) > 0/g, `_dir.lengthSq() > 0`);

// Fix random shake
code = code.replace(/\(Math\.random\(\) - 0\.5\)/g, `(hash11(currentTime * 100.0) - 0.5)`);

// Fix cinematic lookat
code = code.replace(/const targetLookAt = new THREE\.Vector3\(0, -t \* 22, -100\);/g, `_targetLookAt.set(0, -t * 22, -100);`);
code = code.replace(/smoothedLookAt\.current\.lerp\(targetLookAt, delta \* 3\.5\);/g, `smoothedLookAt.current.lerp(_targetLookAt, delta * 3.5);`);

// Fix updateProjectionMatrix
code = code.replace(/camera\.fov = THREE\.MathUtils\.lerp\(camera\.fov, targetFov, delta \* 3\.0\);\n      camera\.updateProjectionMatrix\(\);/,
`const nextFov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 3.0);
      if (Math.abs(camera.fov - nextFov) > 0.01) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }`);

fs.writeFileSync('src/components/Camera/PlayerCameraController.tsx', code);
