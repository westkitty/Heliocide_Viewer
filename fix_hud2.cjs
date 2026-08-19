const fs = require('fs');
let code = fs.readFileSync('src/components/UI/HUD.tsx', 'utf8');

code = code.replace(/import \{ useState \} from 'react';/, 'import { useState, useEffect } from "react";');
code = code.replace(/import \{ Volume2, Settings, ShieldAlert \} from 'lucide-react';/, 'import { Volume2, Settings, ShieldAlert, Crosshair, MousePointer2 } from "lucide-react";');

code = code.replace(/export function HUD\(\) \{/, 
`export function HUD() {
  const [isLocked, setIsLocked] = useState(false);
  useEffect(() => {
    const handleLockChange = () => setIsLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);`);

fs.writeFileSync('src/components/UI/HUD.tsx', code);
