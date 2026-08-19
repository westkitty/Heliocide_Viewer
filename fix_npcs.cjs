const fs = require('fs');
let code = fs.readFileSync('src/components/Station/NPCs.tsx', 'utf8');
code = code.replace(/getCrewWaypoint\(member\.id, currentTime\)/g, "getCrewWaypoint(member.id, useTimelineStore.getState().currentTime)");
code = code.replace(/import \{ useRef, useMemo, useEffect \} from 'react';/, "import { useRef, useMemo } from 'react';");
code = code.replace(/const currentPhase = useTimelineStore\(\(s\) => s\.currentPhase\);\n/g, "");
fs.writeFileSync('src/components/Station/NPCs.tsx', code);
