const fs = require('fs');

function isEditableCheck() {
  return `if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;`;
}

// 1. App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/const handleKeyDown = \(e: KeyboardEvent\) => \{/, 
`const handleKeyDown = (e: KeyboardEvent) => {
      ${isEditableCheck()}`);
fs.writeFileSync('src/App.tsx', appCode);

// 2. PlayerCameraController.tsx
let camCode = fs.readFileSync('src/components/Camera/PlayerCameraController.tsx', 'utf8');
camCode = camCode.replace(/const handleKeyDown = \(e: KeyboardEvent\) => \{/, 
`const handleKeyDown = (e: KeyboardEvent) => {
      ${isEditableCheck()}`);
fs.writeFileSync('src/components/Camera/PlayerCameraController.tsx', camCode);

