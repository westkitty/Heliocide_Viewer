/**
 * Procedural Web Audio API Sound Engine for Heliocide Observatory.
 * Zero external audio asset dependencies. 100% browser-safe and offline.
 */

class SoundEngine {
  public ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Ambient nodes
  private stationDroneOsc1: OscillatorNode | null = null;
  private stationDroneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  
  // Noise ventilation
  private noiseGain: GainNode | null = null;

  // Gravitational rumble
  private rumbleOsc: OscillatorNode | null = null;
  private rumbleGain: GainNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;

  // Alarm synth
  private alarmOsc: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;

  private isInitialized = false;
  public lastPhase: string = '';

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Station Drone
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.droneGain.connect(this.masterGain);

      this.stationDroneOsc1 = this.ctx.createOscillator();
      this.stationDroneOsc1.type = 'sawtooth';
      this.stationDroneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

      this.stationDroneOsc2 = this.ctx.createOscillator();
      this.stationDroneOsc2.type = 'sine';
      this.stationDroneOsc2.frequency.setValueAtTime(110.5, this.ctx.currentTime);

      const droneFilter = this.ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(200, this.ctx.currentTime);

      this.stationDroneOsc1.connect(droneFilter);
      this.stationDroneOsc2.connect(droneFilter);
      droneFilter.connect(this.droneGain);

      this.stationDroneOsc1.start();
      this.stationDroneOsc2.start();

      // Ventilation Noise Buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      noiseFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);
      whiteNoise.start();

      // Gravitational Rumble
      this.rumbleGain = this.ctx.createGain();
      this.rumbleGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.rumbleGain.connect(this.masterGain);

      this.rumbleFilter = this.ctx.createBiquadFilter();
      this.rumbleFilter.type = 'lowpass';
      this.rumbleFilter.frequency.setValueAtTime(80, this.ctx.currentTime);

      this.rumbleOsc = this.ctx.createOscillator();
      this.rumbleOsc.type = 'triangle';
      this.rumbleOsc.frequency.setValueAtTime(38, this.ctx.currentTime);
      this.rumbleOsc.connect(this.rumbleFilter);
      this.rumbleFilter.connect(this.rumbleGain);
      this.rumbleOsc.start();

      // Alarm Osc
      this.alarmGain = this.ctx.createGain();
      this.alarmGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.alarmGain.connect(this.masterGain);

      this.alarmOsc = this.ctx.createOscillator();
      this.alarmOsc.type = 'sine';
      this.alarmOsc.frequency.setValueAtTime(880, this.ctx.currentTime);
      this.alarmOsc.connect(this.alarmGain);
      this.alarmOsc.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization deferred:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public dispose() {
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

  public cancelFutureAutomations(now: number) {
    if (!this.ctx) return;
    if (this.rumbleGain) this.rumbleGain.gain.cancelScheduledValues(now);
    if (this.rumbleFilter) this.rumbleFilter.frequency.cancelScheduledValues(now);
    if (this.rumbleOsc) this.rumbleOsc.frequency.cancelScheduledValues(now);
    if (this.alarmGain) this.alarmGain.gain.cancelScheduledValues(now);
    if (this.alarmOsc) this.alarmOsc.frequency.cancelScheduledValues(now);
    if (this.masterGain) this.masterGain.gain.cancelScheduledValues(now);
  }

  public update(time: number, phase: string, volume: number = 0.8, isPlaying: boolean = true) {
    if (!this.ctx || !this.isInitialized) return;
    const now = this.ctx.currentTime;

    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(isPlaying ? volume : 0.0001, now, 0.05);
    }

    // Trigger phase transition cues
    if (phase !== this.lastPhase) {
      // Only play transition cues if we are actively playing forward
      if (isPlaying) {
        this.handlePhaseTransition(phase, now);
      } else {
        this.cancelFutureAutomations(now);
      }
      this.lastPhase = phase;
    }

    // Dynamic modulation based on timeline time
    if (this.rumbleGain && this.rumbleFilter && this.rumbleOsc) {
      if (phase === 'PHASE_D_HELIOCIDE') {
        const progress = (time - 52.0) / 26.0;
        this.rumbleGain.gain.setTargetAtTime(0.35 * Math.min(1, progress * 1.5), now, 0.1);
        this.rumbleFilter.frequency.setTargetAtTime(60 + progress * 80, now, 0.1);
        this.rumbleOsc.frequency.setTargetAtTime(32 + Math.sin(time * 6) * 10, now, 0.1);
      } else if (phase === 'PHASE_E_CASCADE') {
        const progress = (time - 78.0) / 26.0;
        this.rumbleGain.gain.setTargetAtTime(0.45, now, 0.1);
        this.rumbleFilter.frequency.setTargetAtTime(120 + Math.sin(time * 12) * 40, now, 0.1);
        this.rumbleOsc.frequency.setTargetAtTime(28 + progress * 15, now, 0.1);
      } else if (phase === 'PHASE_F_SIEGE_WALL') {
        this.rumbleGain.gain.setTargetAtTime(0.25, now, 0.2);
        this.rumbleFilter.frequency.setTargetAtTime(45, now, 0.2);
      } else if (phase === 'PHASE_G_STATION_LOSS') {
        const progress = (time - 122.0) / 16.0;
        this.rumbleGain.gain.setTargetAtTime(Math.max(0.001, 0.3 * (1 - progress)), now, 0.3);
      } else {
        this.rumbleGain.gain.setTargetAtTime(0.0001, now, 0.2);
      }
    }

    // Alarm pulsing
    if (this.alarmGain && this.alarmOsc) {
      if (phase === 'PHASE_B_AUREAL_ALERT') {
        const pulse = (Math.sin(time * 4) > 0.3) ? 0.08 : 0.0001;
        this.alarmGain.gain.setTargetAtTime(pulse, now, 0.03);
        this.alarmOsc.frequency.setTargetAtTime(660, now, 0.01);
      } else if (phase === 'PHASE_D_HELIOCIDE' || phase === 'PHASE_E_CASCADE') {
        const pulse = (Math.sin(time * 8) > 0.1) ? 0.12 : 0.0001;
        this.alarmGain.gain.setTargetAtTime(pulse, now, 0.02);
        this.alarmOsc.frequency.setTargetAtTime(880 + Math.sin(time * 16) * 120, now, 0.02);
      } else {
        this.alarmGain.gain.setTargetAtTime(0.0001, now, 0.1);
      }
    }
  }

  private handlePhaseTransition(phase: string, now: number) {
    if (!this.ctx || !this.masterGain) return;

    if (phase === 'PHASE_B_AUREAL_ALERT') {
      this.playChimeSequence([440, 659.25, 880], 0.15, now);
    } else if (phase === 'PHASE_C_SHARD_GOD_AUTHORITY') {
      this.playChimeSequence([329.63, 440, 587.33, 880], 0.2, now);
      this.playSubBassImpulse(now, 60, 1.8);
    } else if (phase === 'PHASE_D_HELIOCIDE') {
      this.playExplosiveRumble(now, 2.5);
    } else if (phase === 'PHASE_E_CASCADE') {
      this.playBreachDecompression(now, 3.0);
    }
  }

  public playUIClick() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playConsoleBeep() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  private playChimeSequence(frequencies: number[], noteDuration: number, startTime: number) {
    if (!this.ctx || !this.masterGain) return;
    frequencies.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = startTime + idx * noteDuration;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDuration * 1.8);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + noteDuration * 1.8);
    });
  }

  private playSubBassImpulse(startTime: number, freq: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(24, startTime + duration);
    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playExplosiveRumble(startTime: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, startTime);
    osc.frequency.exponentialRampToValueAtTime(20, startTime + duration);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, startTime);
    filter.frequency.exponentialRampToValueAtTime(40, startTime + duration);

    gain.gain.setValueAtTime(0.5, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playBreachDecompression(startTime: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 1.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, startTime);
    filter.frequency.exponentialRampToValueAtTime(300, startTime + duration);
    filter.Q.setValueAtTime(3.0, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(startTime);
  }
}

export const soundSystem = new SoundEngine();
