import React, { useEffect, useRef } from 'react';
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
      useTimelineStore.getState().pause(); // Pause time so audio stops and desync is avoided
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

    const { currentTime, currentPhase, accessibility, isPlaying } = useTimelineStore.getState();
    // Update procedural sound engine with current deterministic time & phase
    soundSystem.update(currentTime, currentPhase, accessibility.masterVolume, isPlaying);
  });

  return null;
}


class CanvasErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color: 'red', padding: '20px', zIndex: 9999, position: 'relative'}}>WebGL Presentation Failure. Containment aborted.</div>;
    }
    return this.props.children;
  }
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

    useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        useTimelineStore.getState().pause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleCanvasClick = () => {
    soundSystem.init();
    soundSystem.resume();
    useTimelineStore.getState().unlockAudio();
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* 3D WebGL Canvas */}
      <CanvasErrorBoundary>
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
      </CanvasErrorBoundary>

      {/* 2D DOM Interfaces */}
      <HUD />
      <TacticalDossierModal />
      <ForensicReplayControls />
    </div>
  );
}

export default App;
