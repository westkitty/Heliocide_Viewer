const fs = require('fs');
let code = fs.readFileSync('src/components/Station/NPCs.tsx', 'utf8');

// Fix ArticulatedCrewCharacter subscription
code = code.replace(/const currentTime = useTimelineStore\(\(s\) => s\.currentTime\);/, 
`const isCatastrophe = useTimelineStore((s) => s.currentTime >= 52.0);`);

// Replace currentTime > 52.0 with isCatastrophe
code = code.replace(/currentTime > 52\.0/g, 'isCatastrophe');

// Fix NPCs component
code = code.replace(/export function NPCs\(\) \{[\s\S]*?return \(/, 
`export function NPCs() {
  const currentPhase = useTimelineStore((s) => s.currentPhase);
  const setSubtitle = useTimelineStore((s) => s.setSubtitle);

  // Synchronize narrative subtitle state without high-frequency React churn
  useFrame(() => {
    const time = useTimelineStore.getState().currentTime;
    const v = getCrewWaypoint('vaelen', time);
    const c = getCrewWaypoint('corin', time);
    const s = getCrewWaypoint('selene', time);
    
    const phase = useTimelineStore.getState().currentPhase;
    let nextSubtitle = null;

    if (phase === 'PHASE_A_NORMAL') {
      nextSubtitle = 'Observation Station HV-88 — Hal\\'Ven Cluster — Nominal Operations';
    } else if (phase === 'PHASE_B_AUREAL_ALERT') {
      nextSubtitle = \`[Officer Selene]: "\${s.dialogue}"\`;
    } else if (phase === 'PHASE_C_SHARD_GOD_AUTHORITY') {
      nextSubtitle = \`[Commander Vaelen]: "\${v.dialogue}"\`;
    } else if (phase === 'PHASE_D_HELIOCIDE') {
      nextSubtitle = \`[Specialist Corin]: "\${c.dialogue}"\`;
    } else if (phase === 'PHASE_E_CASCADE') {
      nextSubtitle = \`[Commander Vaelen]: "\${v.dialogue}"\`;
    } else if (phase === 'PHASE_F_SIEGE_WALL') {
      nextSubtitle = \`[Officer Selene]: "\${s.dialogue}"\`;
    } else if (phase === 'PHASE_G_STATION_LOSS') {
      nextSubtitle = 'SYSTEM TELEMETRY TERMINATED — CONTAINMENT ACHIEVED';
    }
    
    if (useTimelineStore.getState().activeSubtitle !== nextSubtitle) {
      setSubtitle(nextSubtitle);
    }
  });

  return (`);

fs.writeFileSync('src/components/Station/NPCs.tsx', code);
