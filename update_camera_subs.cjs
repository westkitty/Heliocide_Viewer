const fs = require('fs');
let code = fs.readFileSync('src/components/Camera/PlayerCameraController.tsx', 'utf8');

// Remove React subscription
code = code.replace(/const currentTime = useTimelineStore\(\(s\) => s\.currentTime\);\n/g, '');

// In useFrame, get it from state
code = code.replace(/useFrame\(\(_, delta\) => \{/g, `useFrame((_, delta) => {
    const currentTime = useTimelineStore.getState().currentTime;`);

fs.writeFileSync('src/components/Camera/PlayerCameraController.tsx', code);
