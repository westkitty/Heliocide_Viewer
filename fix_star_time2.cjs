const fs = require('fs');
let code = fs.readFileSync('src/components/Space/StarCollapseShader.tsx', 'utf8');

code = code.replace(/\/\/ Removed nondeterministic rotation; shader handles movement/g, '');

// Actually set absolute rotation based on currentTime
code = code.replace(/if \(diskRef\.current\) \{/g, 
`meshRef.current.rotation.y = currentTime * (0.05 + progress * 0.5);
    if (diskRef.current) {`);

code = code.replace(/diskRef\.current\.scale\.setScalar\(\(baseScale \+ pulse\) \* 1\.6\);\n/g,
`diskRef.current.scale.setScalar((baseScale + pulse) * 1.6);
      diskRef.current.rotation.z = -currentTime * 0.03;\n`);

fs.writeFileSync('src/components/Space/StarCollapseShader.tsx', code);
