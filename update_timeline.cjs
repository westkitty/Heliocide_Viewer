const fs = require('fs');
let code = fs.readFileSync('src/store/timelineStore.ts', 'utf8');

// fix URL parser
code = code.replace(/function getInitialStateFromURL\(\) \{[\s\S]*?const initialURL = getInitialStateFromURL\(\);/m, `function getInitialStateFromURL() {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const timeParam = params.get('time');
    const cameraParam = params.get('camera');
    const modalParam = params.get('modal');
    const pausedParam = params.get('paused');

    let time = 0;
    if (timeParam !== null) {
      const parsed = parseFloat(timeParam);
      if (Number.isFinite(parsed)) {
        time = Math.max(0, Math.min(TOTAL_EXPERIENCE_DURATION, parsed));
      }
    }

    const phase = getPhaseAtTime(time);
    
    // validate camera mode
    const VALID_CAMERA_MODES: CameraMode[] = ['FIRST_PERSON', 'EXTERIOR_INSPECTION', 'CINEMATIC'];
    let cameraMode: CameraMode = time >= 122.0 ? 'CINEMATIC' : 'FIRST_PERSON';
    if (cameraParam && VALID_CAMERA_MODES.includes(cameraParam as CameraMode)) {
      cameraMode = cameraParam as CameraMode;
    }

    const tacticalModalOpen = modalParam === 'true';
    const isPlaying = pausedParam === 'true' ? false : true;
    const tacticalTab: TacticalTab = (phase === 'PHASE_C_SHARD_GOD_AUTHORITY' || (time >= 32.0 && time < 52.0)) ? 'SHARD_GOD_DOSSIER' : 'OVERVIEW';

    return {
      currentTime: time,
      currentPhase: phase,
      cameraMode,
      tacticalModalOpen,
      tacticalTab,
      isPlaying
    };
  } catch {
    return {};
  }
}

const initialURL = getInitialStateFromURL();`);

// fix seek method to prevent NaN
code = code.replace(/seek: \(time: number\) => \{[\s\S]*?\},/m, `seek: (time: number) => {
    if (!Number.isFinite(time)) return;
    const clamped = Math.max(0, Math.min(TOTAL_EXPERIENCE_DURATION, time));
    const phase = getPhaseAtTime(clamped);
    set({
      currentTime: clamped,
      currentPhase: phase
    });
  },`);

// fix setPlaybackRate
code = code.replace(/setPlaybackRate: \(rate: number\) => set\(\{ playbackRate: rate \}\),/m, `setPlaybackRate: (rate: number) => {
    if (Number.isFinite(rate) && rate > 0 && rate <= 10) {
      set({ playbackRate: rate });
    }
  },`);

fs.writeFileSync('src/store/timelineStore.ts', code);
