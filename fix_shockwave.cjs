const fs = require('fs');
let code = fs.readFileSync('src/components/Space/CollapseShockwave.tsx', 'utf8');

const hookInsert = `import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTimelineStore } from '../../store/timelineStore';

// Simple deterministic PRNG
function seedRandom(s) {
  return function() {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}
`;

code = code.replace(/import \{ useRef, useMemo \} from 'react';\nimport \* as THREE from 'three';\nimport \{ useFrame \} from '@react-three\/fiber';\nimport \{ useTimelineStore \} from '\.\.\/\.\.\/store\/timelineStore';/g, hookInsert);

code = code.replace(/const theta = Math\.random\(\) \* Math\.PI \* 2;/g, `const prng = seedRandom(i * 1337);
      const theta = prng() * Math.PI * 2;`);

code = code.replace(/const phi = \(Math\.random\(\) - 0\.5\) \* Math\.PI \* 0\.7;/g, `const phi = (prng() - 0.5) * Math.PI * 0.7;`);
code = code.replace(/const speed = 45 \+ Math\.random\(\) \* 120;/g, `const speed = 45 + prng() * 120;`);
code = code.replace(/const blueShift = Math\.random\(\);/g, `const blueShift = prng();`);

fs.writeFileSync('src/components/Space/CollapseShockwave.tsx', code);
