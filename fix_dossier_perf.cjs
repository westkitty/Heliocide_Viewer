const fs = require('fs');
let code = fs.readFileSync('src/components/UI/TacticalDossierModal.tsx', 'utf8');

const timeDisplayInsert = `function TimeDisplay() {
  const time = useTimelineStore((s) => s.currentTime);
  return <>{time.toFixed(1)}s</>;
}

function HalVenStateDisplay() {
  const time = useTimelineStore((s) => s.currentTime);
  const color = time > 52.0 ? '#ef4444' : '#10b981';
  const text = time > 78.0 ? 'STATE: COLLAPSED SINGULARITY' : time > 52.0 ? 'STATE: GRAVITATIONAL IMPLOSION' : 'STATE: STABLE FUSION';
  return <div style={{ fontSize: '0.8rem', color, marginTop: '4px' }}>{text}</div>;
}`;

code = code.replace(/import \{ X, Shield, Activity, Database, AlertCircle \} from 'lucide-react';/g, 
  `import { X, Shield, Activity, Database, AlertCircle } from 'lucide-react';\n\n${timeDisplayInsert}`);

code = code.replace(/const currentTime = useTimelineStore\(\(s\) => s\.currentTime\);\n/g, '');

code = code.replace(/TIME INDEX: \{currentTime\.toFixed\(1\)\}s/g, 'TIME INDEX: <TimeDisplay />');

code = code.replace(/<div style=\{\{ fontSize: '0\.8rem', color: currentTime > 52\.0 \? '#ef4444' : '#10b981', marginTop: '4px' \}\}>\n\s*\{currentTime > 78\.0 \? 'STATE: COLLAPSED SINGULARITY' : currentTime > 52\.0 \? 'STATE: GRAVITATIONAL IMPLOSION' : 'STATE: STABLE FUSION'\}\n\s*<\/div>/g, 
  '<HalVenStateDisplay />');

fs.writeFileSync('src/components/UI/TacticalDossierModal.tsx', code);
