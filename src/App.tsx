import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTimelineStore } from './store/timelineStore';
import { soundSystem } from './audio/SoundSystem';
import { CelestialSystem } from './components/Space/CelestialSystem';
import { StationInterior } from './components/Station/StationInterior';
import { CameraManager } from './components/Camera/PlayerCameraController';
import { HeliocidePostProcessing } from './components/PostProcessing/HeliocidePostProcessing';
import { HUD } from './components/UI/HUD';
import { TacticalDossierModal } from './components/UI/TacticalDossierModal';
import { ForensicReplayControls } from './components/UI/ForensicReplayControls';

const FIXED_TIME_STEP = 1 / 60;
const MAX_CATCH_UP_STEPS = 4;

function SimulationFrameLoop() {
  const { gl } = useThree();
  const accumulator = useRef(0);

  // WebGL Context Loss & Restoration Lifecycle Guard
  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('[Heliocide] WebGL context lost. Stabilizing presentation...');
    };
    const handleContextRestored = () => {
      console.info('[Heliocide] WebGL context successfully restored.');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  useFrame((_, delta) => {
    // Accumulator-based fixed simulation step with capped catch-up
    accumulator.current += Math.min(delta, 0.1);
    let steps = 0;
    while (accumulator.current >= FIXED_TIME_STEP && steps < MAX_CATCH_UP_STEPS) {
      useTimelineStore.getState().tick(FIXED_TIME_STEP);
      accumulator.current -= FIXED_TIME_STEP;
      steps++;
    }

    const { currentTime, currentPhase, accessibility } = useTimelineStore.getState();
    // Update procedural sound engine with current deterministic time & phase
    soundSystem.update(currentTime, currentPhase, accessibility.masterVolume);
  });

  return null;
}

export function App() {
  // Global key bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
      if (e.code === 'KeyE') {
        const isOpen = useTimelineStore.getState().tacticalModalOpen;
        useTimelineStore.getState().setTacticalModalOpen(!isOpen);
      } else if (e.code === 'Escape' && useTimelineStore.getState().tacticalModalOpen) {
        useTimelineStore.getState().setTacticalModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      soundSystem.dispose();
    };
  }, []);

  const handleCanvasClick = () => {
    soundSystem.init();
    soundSystem.resume();
    useTimelineStore.getState().unlockAudio();
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* 3D WebGL Canvas */}
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        camera={{
          position: [0, 1.7, 2],
          fov: 70,
          near: 0.1,
          far: 2500
        }}
        onClick={handleCanvasClick}
      >
        <SimulationFrameLoop />
        <CameraManager />
        <StationInterior />
        <CelestialSystem />
        <HeliocidePostProcessing />
      </Canvas>

      {/* 2D DOM Interfaces */}
      <HUD />
      <TacticalDossierModal />
      <ForensicReplayControls />
    </div>
  );
}

export default App;
