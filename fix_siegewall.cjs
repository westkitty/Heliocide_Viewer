const fs = require('fs');
let code = fs.readFileSync('src/components/Space/SiegeWallVoid.tsx', 'utf8');

code = code.replace(/materialRef\.current\.uniforms\.uTime\.value \+= delta;/g, 'materialRef.current.uniforms.uTime.value = currentTime;');
code = code.replace(/useFrame\(\(_, delta\) => \{/g, 'useFrame(() => {');

fs.writeFileSync('src/components/Space/SiegeWallVoid.tsx', code);
