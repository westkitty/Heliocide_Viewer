import { useState, useEffect } from "react";
import { useTimelineStore, computeSubsystems, PHASE_TIMELINE } from '../../store/timelineStore';
import { soundSystem } from '../../audio/SoundSystem';
import { 
  Settings, 
  Volume2, 
  ShieldAlert, 
  MousePointer2,
  Eye,
  Camera,
  FastForward,
  RotateCcw
} from 'lucide-react';
import { AccessibilitySettingsModal } from './AccessibilitySettings';

export function HUD() {
  const { currentTime, currentPhase, tacticalModalOpen, setTacticalModalOpen, audioUnlocked, unlockAudio, accessibility, activeSubtitle, cameraMode, setCameraMode } = useTimelineStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  useEffect(() => {
    const handleLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement);
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);

  const subsystems = computeSubsystems(currentTime);
  const currentMarker = PHASE_TIMELINE.find((p) => p.phase === currentPhase);

  const handleAudioUnlock = () => {
    soundSystem.init();
    soundSystem.resume();
    unlockAudio();
    soundSystem.playUIClick();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
        color: '#f8fafc',
        opacity: isPointerLocked ? 0 : 1,
        transition: 'opacity 0.2s ease'
      }}
    >
      {/* Top Navigation Bar */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pointerEvents: 'auto'
        }}
      >
        {/* Top Left: Station Identity & Time */}
        <div
          style={{
            backgroundColor: 'rgba(11, 17, 32, 0.85)',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '12px 18px',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: subsystems.orbitalStability > 50 ? '#10b981' : '#ef4444', display: 'inline-block' }} />
            <h1 style={{ fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.06em', color: '#f8fafc' }}>
              STATION HV-88 // HAL'VEN CLUSTER
            </h1>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            ORBIT: 420 KM // INHABITED TARGET: HAL'VEN IV (4.8B POP)
          </div>
        </div>

        {/* Top Center: Phase Status Banner */}
        <div
          style={{
            backgroundColor: 'rgba(11, 17, 32, 0.9)',
            border: currentPhase === 'PHASE_C_SHARD_GOD_AUTHORITY' ? '1px solid #00e5ff' : '1px solid #1e293b',
            borderRadius: '6px',
            padding: '10px 24px',
            backdropFilter: 'blur(8px)',
            textAlign: 'center',
            maxWidth: '520px',
            boxShadow: currentPhase === 'PHASE_C_SHARD_GOD_AUTHORITY' ? '0 0 20px rgba(0, 229, 255, 0.2)' : 'none'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', color: currentPhase === 'PHASE_C_SHARD_GOD_AUTHORITY' ? '#00e5ff' : currentPhase === 'PHASE_D_HELIOCIDE' || currentPhase === 'PHASE_E_CASCADE' ? '#ef4444' : '#38bdf8' }}>
            {currentMarker?.title || 'SECTOR TELEMETRY'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '3px' }}>
            {currentMarker?.summary}
          </div>
        </div>

        {/* Top Right: Subsystems & Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {/* Subsystems Readout */}
          {subsystems.hullIntegrity > 0 ? (
          <div
            style={{
              backgroundColor: 'rgba(11, 17, 32, 0.85)',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '10px 14px',
              backdropFilter: 'blur(8px)',
              fontSize: '0.75rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px 14px'
            }}
          >
            <div>
              <span style={{ color: '#94a3b8' }}>Hull: </span>
              <strong style={{ color: subsystems.hullIntegrity > 50 ? '#10b981' : '#ef4444' }}>{subsystems.hullIntegrity}%</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Orbit: </span>
              <strong style={{ color: subsystems.orbitalStability > 50 ? '#10b981' : '#ef4444' }}>{subsystems.orbitalStability}%</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Life Support: </span>
              <strong style={{ color: subsystems.lifeSupport > 50 ? '#10b981' : '#ef4444' }}>{subsystems.lifeSupport}%</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Q-Comms: </span>
              <strong style={{ color: subsystems.quantumComms ? '#10b981' : '#ef4444' }}>{subsystems.quantumComms ? 'ONLINE' : 'OFFLINE'}</strong>
            </div>
          </div>
          ) : (
            <div style={{
              backgroundColor: 'rgba(11, 17, 32, 0.85)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '10px 14px',
              color: '#ef4444',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              letterSpacing: '0.1em'
            }}>
              ALL TELEMETRY LOST
            </div>
          )}

          {/* Action buttons */}
          {subsystems.hullIntegrity > 0 && (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button
                onClick={() => { soundSystem.playUIClick(); setSettingsOpen(true); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem'
                }}
              >
                <Settings size={14} /> Settings
              </button>
              <button
                onClick={() => { if (currentTime < 122) { soundSystem.playUIClick(); setTacticalModalOpen(true); } }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentTime >= 122 ? '#334155' : '#ef4444',
                  cursor: currentTime >= 122 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  opacity: currentTime >= 122 ? 0.3 : 1
                }}
                disabled={currentTime >= 122}
                title={currentTime >= 122 ? "Tactical Link Lost" : "Open Tactical Console"}
              >
                <ShieldAlert size={14} /> Tactical Console [E]
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audio Unlock Prompt if browser audio not enabled */}
      {!audioUnlocked && (
        <div
          style={{
            position: 'absolute',
            top: '85px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1e1b4b',
            border: '1px solid #6366f1',
            borderRadius: '6px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'auto',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
          }}
        >
          <Volume2 size={16} color="#a5b4fc" />
          <span style={{ fontSize: '0.8rem', color: '#e0e7ff' }}>
            Click to enable station acoustic synthesis
          </span>
          <button
            onClick={handleAudioUnlock}
            style={{
              backgroundColor: '#4f46e5',
              border: 'none',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Enable Audio
          </button>
        </div>
      )}

      {/* Center Subtitles / Narrative Voice Log */}
      {accessibility.subtitles && activeSubtitle && (
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            border: '1px solid #1e293b',
            borderRadius: '4px',
            padding: '8px 20px',
            backdropFilter: 'blur(8px)',
            maxWidth: '800px',
            textAlign: 'center',
            fontSize: accessibility.fontSize === 'large' ? '1.05rem' : '0.9rem',
            color: '#f1f5f9',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
          }}
        >
          {activeSubtitle}
        </div>
      )}

      {/* Final Restrained Ending Banner */}
      {currentTime >= 137.0 && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'auto'
          }}
        >
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '0.25em',
              color: '#00e5ff',
              textShadow: '0 0 30px rgba(0, 229, 255, 0.8)',
              marginBottom: '12px'
            }}
          >
            CONTAINMENT ACHIEVED
          </div>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8', letterSpacing: '0.1em' }}>
            HAL'VEN SECTOR QUARANTINE CORDON SEALED BY SHARD GOD
          </div>
        </div>
      )}

      {/* Bottom Left Camera Controls & Hints */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'auto'
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => { soundSystem.playUIClick(); setCameraMode('WALKTHROUGH'); }}
            style={{
              padding: '6px 10px',
              backgroundColor: cameraMode === 'WALKTHROUGH' ? '#0ea5e9' : 'rgba(11, 17, 32, 0.85)',
              border: cameraMode === 'WALKTHROUGH' ? '1px solid #00e5ff' : '1px solid #1e293b',
              borderRadius: '4px',
              color: cameraMode === 'WALKTHROUGH' ? '#f8fafc' : '#94a3b8',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)'
            }}
          >
            <Eye size={14} /> Walkthrough
          </button>
          <button
            onClick={() => { soundSystem.playUIClick(); setCameraMode('OBSERVATION'); }}
            style={{
              padding: '6px 10px',
              backgroundColor: cameraMode === 'OBSERVATION' ? '#0ea5e9' : 'rgba(11, 17, 32, 0.85)',
              border: cameraMode === 'OBSERVATION' ? '1px solid #00e5ff' : '1px solid #1e293b',
              borderRadius: '4px',
              color: cameraMode === 'OBSERVATION' ? '#f8fafc' : '#94a3b8',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)'
            }}
          >
            <Camera size={14} /> Observation
          </button>
          <button
            onClick={() => { soundSystem.playUIClick(); setCameraMode('CINEMATIC'); }}
            style={{
              padding: '6px 10px',
              backgroundColor: cameraMode === 'CINEMATIC' ? '#0ea5e9' : 'rgba(11, 17, 32, 0.85)',
              border: cameraMode === 'CINEMATIC' ? '1px solid #00e5ff' : '1px solid #1e293b',
              borderRadius: '4px',
              color: cameraMode === 'CINEMATIC' ? '#f8fafc' : '#94a3b8',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
                gap: '6px',
                backdropFilter: 'blur(8px)'
              }}
            >
              <FastForward size={14} /> Cinematic
            </button>
          
          <button
            onClick={() => {
              soundSystem.playUIClick();
              // Simulate pressing 'R' to recenter orbit controls
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
            }}
            style={{
              padding: '6px 10px',
              backgroundColor: 'rgba(11, 17, 32, 0.85)',
              border: '1px solid #1e293b',
              borderRadius: '4px',
              color: '#94a3b8',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
              marginLeft: '8px'
            }}
            title="Recenter Camera (R)"
          >
            <RotateCcw size={14} /> Recenter [R]
          </button>
        </div>
        <div
          style={{
            backgroundColor: 'rgba(11, 17, 32, 0.7)',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MousePointer2 size={12} />
          <span>
            {cameraMode === 'WALKTHROUGH' 
              ? '[WASD] Move | [Drag] Free Look | [E] Dossier' 
              : '[Drag] Orbit | [Scroll] Zoom | [E] Dossier'
            }
          </span>
        </div>
      </div>

      {/* Walkthrough Interaction Overlay */}
      {cameraMode === 'WALKTHROUGH' && !isPointerLocked && !tacticalModalOpen && !settingsOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'none' // allow click to pass through to canvas
          }}
        >
          <div style={{ backgroundColor: 'rgba(11, 17, 32, 0.85)', border: '1px solid #00e5ff', borderRadius: '8px', padding: '24px', textAlign: 'center', backdropFilter: 'blur(12px)' }}>
            <MousePointer2 size={32} color="#00e5ff" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '1.2rem', color: '#f8fafc', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>
              WALKTHROUGH MODE ACTIVE
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
              Click anywhere to lock cursor and look around.<br />
              Press <strong>ESC</strong> to release cursor and interact with UI.
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <AccessibilitySettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
