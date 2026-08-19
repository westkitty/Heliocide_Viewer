const fs = require('fs');
let code = fs.readFileSync('src/components/UI/TacticalDossierModal.tsx', 'utf8');

const components = `function TimeDisplay() {
  const time = useTimelineStore((s) => s.currentTime);
  return <>{time.toFixed(1)}</>;
}

function HalVenStateDisplay() {
  const time = useTimelineStore((s) => s.currentTime);
  const color = time > 52.0 ? '#ef4444' : '#10b981';
  const text = time > 78.0 ? 'STATE: COLLAPSED SINGULARITY' : time > 52.0 ? 'STATE: GRAVITATIONAL IMPLOSION' : 'STATE: STABLE FUSION';
  return <div style={{ fontSize: '0.8rem', color, marginTop: '4px' }}>{text}</div>;
}

export function TacticalDossierModal() {`;

code = code.replace(/export function TacticalDossierModal\(\) \{/, components);

fs.writeFileSync('src/components/UI/TacticalDossierModal.tsx', code);
