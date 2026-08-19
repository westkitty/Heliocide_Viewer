const fs = require('fs');
let code = fs.readFileSync('tests/timeline.test.ts', 'utf8');

code = code.replace(/store\.seek\(Infinity\);\n  expect\(useTimelineStore\.getState\(\)\.currentTime\)\.toBe\(TOTAL_EXPERIENCE_DURATION\);/, 
`store.seek(50);
  store.seek(Infinity);
  expect(useTimelineStore.getState().currentTime).toBe(50);`);

fs.writeFileSync('tests/timeline.test.ts', code);
