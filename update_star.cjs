const fs = require('fs');
let code = fs.readFileSync('src/components/Space/StarCollapseShader.tsx', 'utf8');

// Preallocate colors
code = code.replace(/export function StarCollapseShader\(\) \{/, 
`const _normalColor = new THREE.Color('#fff4e6');
const _flashColor = new THREE.Color('#bae6fd');
const _collapsedColor = new THREE.Color('#0284c7');

export function StarCollapseShader() {`);

// Replace in useFrame
code = code.replace(/const normalColor = new THREE\.Color\('#fff4e6'\);\n      const flashColor = new THREE\.Color\('#bae6fd'\);\n      const collapsedColor = new THREE\.Color\('#0284c7'\);/g, '');

code = code.replace(/lightRef\.current\.color\.copy\(normalColor\);/g, `lightRef.current.color.copy(_normalColor);`);
code = code.replace(/lightRef\.current\.color\.lerpColors\(normalColor, flashColor, t\);/g, `lightRef.current.color.lerpColors(_normalColor, _flashColor, t);`);
code = code.replace(/lightRef\.current\.color\.lerpColors\(flashColor, collapsedColor, t\);/g, `lightRef.current.color.lerpColors(_flashColor, _collapsedColor, t);`);

fs.writeFileSync('src/components/Space/StarCollapseShader.tsx', code);
