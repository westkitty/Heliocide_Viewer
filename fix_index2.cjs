const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/margin: 0;\n        padding: 0;\n      \}/, 
`margin: 0;
        padding: 0;
      }
      button, canvas, [role="button"], [role="slider"] {
        user-select: none;
      }`);

fs.writeFileSync('index.html', code);
