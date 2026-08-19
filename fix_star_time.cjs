const fs = require('fs');
let code = fs.readFileSync('src/components/Space/StarCollapseShader.tsx', 'utf8');

code = code.replace(/starUniforms\.uTime\.value \+= delta;/g, 'starUniforms.uTime.value = currentTime;');
code = code.replace(/diskUniforms\.uTime\.value \+= delta;/g, 'diskUniforms.uTime.value = currentTime;');

// meshRef.current.rotation.y is also advanced by delta
code = code.replace(/meshRef\.current\.rotation\.y \+= delta \* \(0\.05 \+ progress \* 0\.5\);/g, 
  '// Removed nondeterministic rotation; shader handles movement');

// diskRef.current.rotation.z is advanced by delta
code = code.replace(/diskRef\.current\.rotation\.z \-= delta \* 0\.03;/g,
  '// Removed nondeterministic rotation; shader handles movement');

fs.writeFileSync('src/components/Space/StarCollapseShader.tsx', code);
