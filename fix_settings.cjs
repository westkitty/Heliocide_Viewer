const fs = require('fs');
let code = fs.readFileSync('src/components/UI/AccessibilitySettings.tsx', 'utf8');

const hookInsert = `import { useTimelineStore } from '../../store/timelineStore';
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
  }, [onClose]);`;

code = code.replace(/import \{ useTimelineStore \}.*?const updateAccessibility = useTimelineStore\(\(s\) => s\.updateAccessibility\);/s, hookInsert);

// Add aria-label and ref to the close button
code = code.replace(/<button\n            onClick=\{\(\) => \{ soundSystem\.playUIClick\(\); onClose\(\); \}\}/, 
`<button
            ref={focusRef}
            aria-label="Close Settings"
            onClick={() => { soundSystem.playUIClick(); onClose(); }}`);

fs.writeFileSync('src/components/UI/AccessibilitySettings.tsx', code);
