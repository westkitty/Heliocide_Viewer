const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/user-select: none;\n/g, '');

fs.writeFileSync('index.html', code);
