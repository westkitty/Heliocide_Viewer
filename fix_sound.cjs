const fs = require('fs');
let code = fs.readFileSync('src/audio/SoundSystem.ts', 'utf8');

code = code.replace(/public update\(time: number, phase: string, volume: number = 0\.8\) \{/g, 
`public dispose() {
    if (!this.ctx) return;
    try {
      if (this.rumbleOsc) { this.rumbleOsc.stop(); this.rumbleOsc.disconnect(); }
      if (this.rumbleFilter) this.rumbleFilter.disconnect();
      if (this.rumbleGain) this.rumbleGain.disconnect();
      if (this.alarmOsc) { this.alarmOsc.stop(); this.alarmOsc.disconnect(); }
      if (this.alarmGain) this.alarmGain.disconnect();
      if (this.masterGain) this.masterGain.disconnect();
      this.ctx.close();
    } catch (e) {
      console.warn('AudioContext dispose error:', e);
    }
    this.ctx = null;
    this.isInitialized = false;
  }

  public update(time: number, phase: string, volume: number = 0.8) {`);

fs.writeFileSync('src/audio/SoundSystem.ts', code);
