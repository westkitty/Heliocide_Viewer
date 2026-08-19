const fs = require('fs');
let code = fs.readFileSync('src/components/UI/HUD.tsx', 'utf8');

const hookInsert = `import { Volume2, ShieldAlert, Settings, Crosshair, MousePointer2 } from 'lucide-react';
import { useTimelineStore } from '../../store/timelineStore';

export function HUD() {
  const [isLocked, setIsLocked] = useState(false);
  useEffect(() => {
    const handleLockChange = () => setIsLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);`;

code = code.replace(/import \{ Volume2, ShieldAlert, Settings \} from 'lucide-react';\nimport \{ useTimelineStore \} from '\.\.\/\.\.\/store\/timelineStore';\n\nexport function HUD\(\) \{/s, hookInsert);

const hintReplace = `      {/* Bottom Left Control Hints */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          backgroundColor: 'rgba(11, 17, 32, 0.7)',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <span style={{ color: isLocked ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isLocked ? <Crosshair size={14} /> : <MousePointer2 size={14} />}
          {isLocked ? 'CURSOR LOCKED' : 'CURSOR UNLOCKED'}
        </span>
        <span style={{ borderLeft: '1px solid #334155', paddingLeft: '12px' }}>
          [WASD] Move &nbsp;|&nbsp; [Click Canvas] Look &nbsp;|&nbsp; [ESC] Unlock Cursor &nbsp;|&nbsp; [E] Tactical Console
        </span>
      </div>`;

code = code.replace(/\{\/\* Bottom Left Control Hints \*\/\}.*?\[WASD\] Move &nbsp;\|&nbsp; \[Click Canvas\] Look &nbsp;\|&nbsp; \[ESC\] Unlock Cursor &nbsp;\|&nbsp; \[E\] Tactical Console\n      <\/div>/s, hintReplace);

fs.writeFileSync('src/components/UI/HUD.tsx', code);
