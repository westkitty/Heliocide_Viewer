import { useState } from 'react';
import { useTimelineStore, computeSubsystems, PHASE_TIMELINE } from '../../store/timelineStore';
import { soundSystem } from '../../audio/SoundSystem';
import { Volume2, Settings, ShieldAlert } from 'lucide-react';
import { AccessibilitySettingsModal } from './AccessibilitySettings';

export function HUD() {
  const currentTime = useTimelineStore((s) => s.currentTime);
  const currentPhase = useTimelineStore((s) => s.currentPhase);
  const audioUnlocked = useTimelineStore((s) => s.audioUnlocked);
  const unlockAudio = useTimelineStore((s) => s.unlockAudio);
  const setTacticalModalOpen = useTimelineStore((s) => s.setTacticalModalOpen);
  const activeSubtitle = useTimelineStore((s) => s.activeSubtitle);
  const accessibility = useTimelineStore((s) => s.accessibility);

  const [settingsOpen, setSettingsOpen] = useState(false);
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
        color: '#f8fafc'
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

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { soundSystem.playUIClick(); setTacticalModalOpen(true); }}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#38bdf8',
                borderRadius: '4px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <ShieldAlert size={14} /> Tactical Console [E]
            </button>

            <button
              onClick={() => { soundSystem.playUIClick(); setSettingsOpen(true); }}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#94a3b8',
                borderRadius: '4px',
                padding: '6px',
                cursor: 'pointer'
              }}
              title="Settings & Accessibility"
            >
              <Settings size={14} />
            </button>
          </div>
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

      {/* Final Restrained Ending Banner (Phase G) */}
      {currentPhase === 'PHASE_G_STATION_LOSS' && (
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

      {/* Bottom Left Control Hints */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          backgroundColor: 'rgba(11, 17, 32, 0.7)',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: '#64748b'
        }}
      >
        [WASD] Move &nbsp;|&nbsp; [Click Canvas] Look &nbsp;|&nbsp; [ESC] Unlock Cursor &nbsp;|&nbsp; [E] Tactical Console
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <AccessibilitySettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
