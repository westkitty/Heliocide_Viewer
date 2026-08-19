const fs = require('fs');
let code = fs.readFileSync('src/components/UI/HUD.tsx', 'utf8');

code = code.replace(/title="Settings & Accessibility"/g, 'title="Settings & Accessibility"\n              aria-label="Settings"');

fs.writeFileSync('src/components/UI/HUD.tsx', code);
