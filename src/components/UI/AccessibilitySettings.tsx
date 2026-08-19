import { useTimelineStore } from '../../store/timelineStore';
import { soundSystem } from '../../audio/SoundSystem';
import { X, Sliders } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Props {
  onClose: () => void;
}

export function AccessibilitySettingsModal({ onClose }: Props) {
  const accessibility = useTimelineStore((s) => s.accessibility);
  const updateAccessibility = useTimelineStore((s) => s.updateAccessibility);
  const focusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // initial focus
    if (focusRef.current) focusRef.current.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        pointerEvents: 'auto'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0b1120',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          color: '#f8fafc'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#0f172a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#38bdf8" />
            <h3 id="settings-title" style={{ fontSize: '1rem', fontWeight: 600 }}>
              SETTINGS & ACCESSIBILITY
            </h3>
          </div>
          <button
            ref={focusRef}
            aria-label="Close Settings"
            onClick={() => { soundSystem.playUIClick(); onClose(); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Reduced Motion */}
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Reduced Motion</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Dampens camera tremors, shakes, and violent transitions</div>
            </div>
            <input
              type="checkbox"
              checked={accessibility.reducedMotion}
              onChange={(e) => {
                soundSystem.playUIClick();
                updateAccessibility({ reducedMotion: e.target.checked });
              }}
              style={{ width: '18px', height: '18px', accentColor: '#0284c7' }}
            />
          </label>

          {/* Subtitles */}
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Subtitles & Captions</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Displays narrative dialogues and critical audio cues</div>
            </div>
            <input
              type="checkbox"
              checked={accessibility.subtitles}
              onChange={(e) => {
                soundSystem.playUIClick();
                updateAccessibility({ subtitles: e.target.checked });
              }}
              style={{ width: '18px', height: '18px', accentColor: '#0284c7' }}
            />
          </label>

          {/* Font Size */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Subtitle Text Size</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Adjust HUD subtitle readability</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => { soundSystem.playUIClick(); updateAccessibility({ fontSize: 'normal' }); }}
                style={{
                  padding: '4px 10px',
                  backgroundColor: accessibility.fontSize === 'normal' ? '#0284c7' : '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Normal
              </button>
              <button
                onClick={() => { soundSystem.playUIClick(); updateAccessibility({ fontSize: 'large' }); }}
                style={{
                  padding: '4px 10px',
                  backgroundColor: accessibility.fontSize === 'large' ? '#0284c7' : '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Large
              </button>
            </div>
          </div>

          {/* Master Volume */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Master Volume</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{Math.round(accessibility.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={accessibility.masterVolume}
              onChange={(e) => updateAccessibility({ masterVolume: parseFloat(e.target.value) })}
              style={{ accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>

          {/* Keyboard Navigation Guidance */}
          <div style={{ padding: '12px', backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.5' }}>
            <strong style={{ color: '#e2e8f0' }}>Controls & Pointer Lock:</strong><br />
            • Click the 3D viewport to lock mouse cursor for first-person view.<br />
            • Press <strong>[ESC]</strong> at any time to exit pointer lock.<br />
            • Press <strong>[E]</strong> to open the Administration Tactical Dossier.
          </div>
        </div>
      </div>
    </div>
  );
}
