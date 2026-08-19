const fs = require('fs');
let code = fs.readFileSync('src/components/UI/TacticalDossierModal.tsx', 'utf8');

code = code.replace(/<div style=\{\{ display: 'flex', borderBottom: '1px solid #1e293b' \}\}>/g, `<div role="tablist" style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>`);

code = code.replace(/<button\n              key=\{tab\}/g, `<button
              key={tab}
              role="tab"
              aria-selected={tacticalTab === tab}
              aria-controls={\`panel-\${tab}\`}
              id={\`tab-\${tab}\`}`);

code = code.replace(/<div style=\{\{ flex: 1, padding: '24px', overflowY: 'auto' \}\}>/g, `<div role="tabpanel" id={\`panel-\${tacticalTab}\`} aria-labelledby={\`tab-\${tacticalTab}\`} style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>`);

fs.writeFileSync('src/components/UI/TacticalDossierModal.tsx', code);
