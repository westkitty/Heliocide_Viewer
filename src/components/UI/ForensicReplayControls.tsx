import React, { useState } from 'react';
import { useTimelineStore, TOTAL_EXPERIENCE_DURATION, PHASE_TIMELINE } from '../../store/timelineStore';
import { Play, Pause, RotateCcw, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { PhaseId } from '../../types';
import { soundSystem } from '../../audio/SoundSystem';

export function ForensicReplayControls() {
  const [collapsed, setCollapsed] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  React.useEffect(() => {
    const handleLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement);
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);

  const currentTime = useTimelineStore((s) => s.currentTime);
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const playbackRate = useTimelineStore((s) => s.playbackRate);
  const currentPhase = useTimelineStore((s) => s.currentPhase);

  const seek = useTimelineStore((s) => s.seek);
  const togglePlay = useTimelineStore((s) => s.togglePlay);
  const setPlaybackRate = useTimelineStore((s) => s.setPlaybackRate);
  const restart = useTimelineStore((s) => s.restart);
  const jumpToPhase = useTimelineStore((s) => s.jumpToPhase);
  const setTacticalModalOpen = useTimelineStore((s) => s.setTacticalModalOpen);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seek(time);
  };

  const handlePhaseClick = (phase: PhaseId) => {
    soundSystem.playUIClick();
    jumpToPhase(phase);
  };

  if (collapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(11, 17, 32, 0.92)',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '8px 16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          backdropFilter: 'blur(12px)',
          zIndex: 40,
          opacity: isPointerLocked ? 0 : 1,
          transition: 'opacity 0.2s ease'
        }}
      >
        <button
          onClick={() => { soundSystem.playUIClick(); togglePlay(); }}
          style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <div style={{ color: '#00e5ff', fontSize: '0.85rem', fontWeight: 600 }}>
          {currentTime.toFixed(1)}s
        </div>
        <button
          onClick={() => setCollapsed(false)}
          style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
          title="Expand Timeline"
        >
          <ChevronUp size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '94%',
        maxWidth: '900px',
        backgroundColor: 'rgba(11, 17, 32, 0.92)',
        border: '1px solid #1e293b',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        borderRadius: '8px',
        padding: '12px 20px',
        backdropFilter: 'blur(12px)',
        zIndex: 40,
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        opacity: isPointerLocked ? 0 : 1,
        transition: 'opacity 0.2s ease',
        pointerEvents: isPointerLocked ? 'none' : 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => { soundSystem.playUIClick(); togglePlay(); }}
            style={{
              background: '#0ea5e9',
              border: 'none',
              color: '#f8fafc',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>

          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            <strong style={{ color: '#f8fafc' }}>{currentTime.toFixed(1)}s</strong> / {TOTAL_EXPERIENCE_DURATION.toFixed(0)}s
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>SPEED:</span>
          {[0.5, 1.0, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => { soundSystem.playUIClick(); setPlaybackRate(rate); }}
              style={{
                background: playbackRate === rate ? '#0284c7' : '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              {rate}x
            </button>
          ))}
          <div style={{ width: '1px', height: '20px', background: '#334155', margin: '0 4px' }} />
          <button
            onClick={() => { soundSystem.playUIClick(); restart(); }}
            title="Restart Experience"
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem'
            }}
          >
            <RotateCcw size={12} /> RESTART
          </button>
          
          <button
            onClick={() => { soundSystem.playUIClick(); setTacticalModalOpen(true, 'SHARD_GOD_DOSSIER'); }}
            style={{
              background: '#1e1b4b',
              border: '1px solid #6366f1',
              color: '#c7d2fe',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem'
            }}
          >
            <ShieldAlert size={12} color="#00e5ff" /> DOSSIER
          </button>

          <button
            onClick={() => setCollapsed(true)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: '4px' }}
            title="Collapse Timeline"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', marginTop: '16px', marginBottom: '8px' }}>
        {/* Phase markers embedded into timeline */}
        <div style={{ position: 'absolute', top: '-14px', left: 0, right: 0, height: '10px', pointerEvents: 'none' }}>
          {PHASE_TIMELINE.map((p: any) => {
            if (p.phase === 'PHASE_H_FORENSIC_REPLAY') return null;
            const leftPercent = (p.startTime / TOTAL_EXPERIENCE_DURATION) * 100;
            const widthPercent = ((p.endTime - p.startTime) / TOTAL_EXPERIENCE_DURATION) * 100;
            const isActive = currentPhase === p.phase;
            return (
              <div
                key={p.phase}
                style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: '100%',
                  borderLeft: '1px solid #334155',
                  paddingLeft: '4px',
                }}
              >
                <div style={{ 
                  fontSize: '0.65rem', 
                  color: isActive ? '#00e5ff' : '#64748b', 
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  pointerEvents: 'auto',
                  cursor: 'pointer'
                }} onClick={() => handlePhaseClick(p.phase)} title={p.summary}>
                  {p.shortLabel}
                </div>
              </div>
            );
          })}
        </div>

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
            accentColor: '#00e5ff',
            marginTop: '8px'
          }}
          title={`Time: ${currentTime.toFixed(1)}s`}
        />
      </div>
    </div>
  );
}
