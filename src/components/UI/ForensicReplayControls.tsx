import React from 'react';
import { useTimelineStore, PHASE_TIMELINE, TOTAL_EXPERIENCE_DURATION } from '../../store/timelineStore';
import { CameraMode, PhaseId } from '../../types';
import { soundSystem } from '../../audio/SoundSystem';
import { Play, Pause, RotateCcw, FastForward, Eye, Camera, ShieldAlert } from 'lucide-react';

export function ForensicReplayControls() {
  const currentTime = useTimelineStore((s) => s.currentTime);
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const playbackRate = useTimelineStore((s) => s.playbackRate);
  const currentPhase = useTimelineStore((s) => s.currentPhase);
  const isForensicUnlocked = useTimelineStore((s) => s.isForensicUnlocked);
  const cameraMode = useTimelineStore((s) => s.cameraMode);
  
  const seek = useTimelineStore((s) => s.seek);
  const togglePlay = useTimelineStore((s) => s.togglePlay);
  const setPlaybackRate = useTimelineStore((s) => s.setPlaybackRate);
  const setCameraMode = useTimelineStore((s) => s.setCameraMode);
  const restart = useTimelineStore((s) => s.restart);
  const jumpToPhase = useTimelineStore((s) => s.jumpToPhase);
  const setTacticalModalOpen = useTimelineStore((s) => s.setTacticalModalOpen);

  // If not unlocked and not at the end, provide a smaller toggle or show when unlocked
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seek(time);
  };

  const handlePhaseClick = (phase: PhaseId) => {
    soundSystem.playUIClick();
    jumpToPhase(phase);
  };

  const handleCameraChange = (mode: CameraMode) => {
    soundSystem.playUIClick();
    setCameraMode(mode);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '94%',
        maxWidth: '1100px',
        backgroundColor: 'rgba(11, 17, 32, 0.92)',
        border: '1px solid #1e293b',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        borderRadius: '8px',
        padding: '16px 20px',
        backdropFilter: 'blur(12px)',
        zIndex: 40,
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Top row: Title, Current Phase, Playback controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '4px 8px', backgroundColor: '#1e293b', borderRadius: '4px', fontSize: '0.75rem', color: '#00e5ff', fontWeight: 600 }}>
            {isForensicUnlocked ? 'FORENSIC TELEMETRY REPLAY' : 'TIMELINE CONTROLS'}
          </div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            TIME: <strong style={{ color: '#f8fafc' }}>{currentTime.toFixed(1)}s</strong> / {TOTAL_EXPERIENCE_DURATION.toFixed(0)}s
          </span>
        </div>

        {/* Play / Pause / Speeds / Restart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => { soundSystem.playUIClick(); togglePlay(); }}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#f8fafc',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          {[0.5, 1.0, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => { soundSystem.playUIClick(); setPlaybackRate(rate); }}
              style={{
                background: playbackRate === rate ? '#0284c7' : '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                padding: '6px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {rate}x
            </button>
          ))}

          <button
            onClick={() => { soundSystem.playUIClick(); restart(); }}
            title="Restart Experience"
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              padding: '6px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8rem'
            }}
          >
            <RotateCcw size={14} /> Restart
          </button>

          <button
            onClick={() => { soundSystem.playUIClick(); setTacticalModalOpen(true, 'SHARD_GOD_DOSSIER'); }}
            style={{
              background: '#1e1b4b',
              border: '1px solid #6366f1',
              color: '#c7d2fe',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem'
            }}
          >
            <ShieldAlert size={14} color="#00e5ff" /> Dossier
          </button>
        </div>
      </div>

      {/* Scrubber Range Slider */}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="range"
          min={0}
          max={TOTAL_EXPERIENCE_DURATION}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          aria-label="Forensic Replay Timeline Scrubber"
          style={{
            width: '100%',
            cursor: 'pointer',
            accentColor: '#00e5ff'
          }}
        />
      </div>

      {/* Phase Markers row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
          overflowX: 'auto'
        }}
      >
        {PHASE_TIMELINE.filter(p => p.phase !== 'PHASE_H_FORENSIC_REPLAY').map((p) => {
          const isActive = currentPhase === p.phase;
          return (
            <button
              key={p.phase}
              onClick={() => handlePhaseClick(p.phase)}
              style={{
                padding: '6px 4px',
                backgroundColor: isActive ? '#0f766e' : '#0f172a',
                border: isActive ? '1px solid #00e5ff' : '1px solid #1e293b',
                borderRadius: '4px',
                color: isActive ? '#f0fdfa' : '#94a3b8',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={p.summary}
            >
              {p.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Camera Mode Selectors */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          CAMERA ANGLE:
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => handleCameraChange('WALKTHROUGH')}
            style={{
              padding: '4px 8px',
              backgroundColor: cameraMode === 'WALKTHROUGH' ? '#0284c7' : '#0f172a',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#f8fafc',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Eye size={12} /> Station Interior (1st Person)
          </button>
          <button
            onClick={() => handleCameraChange('OBSERVATION')}
            style={{
              padding: '4px 8px',
              backgroundColor: cameraMode === 'OBSERVATION' ? '#0284c7' : '#0f172a',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#f8fafc',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Camera size={12} /> Exterior Station Orbit
          </button>
          <button
            onClick={() => handleCameraChange('CINEMATIC')}
            style={{
              padding: '4px 8px',
              backgroundColor: cameraMode === 'CINEMATIC' ? '#0284c7' : '#0f172a',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#f8fafc',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FastForward size={12} /> Cinematic Loss Track
          </button>
        </div>
      </div>
    </div>
  );
}
