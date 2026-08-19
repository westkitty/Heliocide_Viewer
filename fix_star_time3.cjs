const fs = require('fs');
let code = fs.readFileSync('src/components/Space/StarCollapseShader.tsx', 'utf8');

code = code.replace(/starUniforms\.uTime\.value = currentTime;/g, 'starUniforms.uTime.value = useTimelineStore.getState().currentTime;');
code = code.replace(/diskUniforms\.uTime\.value = currentTime;/g, 'diskUniforms.uTime.value = useTimelineStore.getState().currentTime;');

fs.writeFileSync('src/components/Space/StarCollapseShader.tsx', code);

let shockCode = fs.readFileSync('src/components/Space/CollapseShockwave.tsx', 'utf8');
shockCode = shockCode.replace(/function seedRandom\(s\)/g, 'function seedRandom(s: number)');
fs.writeFileSync('src/components/Space/CollapseShockwave.tsx', shockCode);
