import { create } from 'zustand';
import { PhaseId, CameraMode, TacticalTab, PhaseMarker, SubsystemStatus, AccessibilitySettings } from '../types';

export const TOTAL_EXPERIENCE_DURATION = 138.0; // seconds

export const PHASE_TIMELINE: PhaseMarker[] = [
  {
    phase: 'PHASE_A_NORMAL',
    startTime: 0,
    endTime: 16.0,
    title: 'PHASE A — NOMINAL OBSERVATION',
    shortLabel: 'Nominal',
    summary: 'Station HV-88 in orbit around Hal\'Ven IV. Star output steady. Orbital traffic routine.',
    audioCue: 'Atmospheric ventilation and reactor hum'
  },
  {
    phase: 'PHASE_B_AUREAL_ALERT',
    startTime: 16.0,
    endTime: 32.0,
    title: 'PHASE B — AUREAL GATE COLLAPSE ALERT',
    shortLabel: 'Aureal Alert',
    summary: 'Flash dispatch: Drakken Empire deployed programmable Starsilk weapon at Aureal Gate. Shard God confirmed harmed.',
    audioCue: 'Tactical alert klaxon and priority data packet chimes'
  },
  {
    phase: 'PHASE_C_SHARD_GOD_AUTHORITY',
    startTime: 32.0,
    endTime: 52.0,
    title: 'PHASE C — SHARD GOD AUTHORITY IDENTIFIED',
    shortLabel: 'Shard God Authority',
    summary: 'Sector defense calculates incoming quarantine vector. Authority confirmed: Shard God. Disproportionate containment initiated.',
    audioCue: 'Deep resonant sub-harmonic pulse; cryptographic auth chirps'
  },
  {
    phase: 'PHASE_D_HELIOCIDE',
    startTime: 52.0,
    endTime: 78.0,
    title: 'PHASE D — LOCAL HELIOCIDE (STELLAR COLLAPSE)',
    shortLabel: 'Heliocide',
    summary: 'Central star Hal\'Ven Prime forced into rapid contraction. Gravitational lensing anomalies; solar radiation spike; orbital decay begins.',
    audioCue: 'Violent low-frequency gravitational roar; emergency alarms'
  },
  {
    phase: 'PHASE_E_CASCADE',
    startTime: 78.0,
    endTime: 104.0,
    title: 'PHASE E — CLUSTER CASCADE & STATION BREACH',
    shortLabel: 'Cascade / Breach',
    summary: 'Neighboring Hal\'Ven stars collapsing sequentially. Local station structural bulkhead compromised; gravity failure; loose debris floating.',
    audioCue: 'Hull tearing, explosive decompression hiss, bulkhead impacts'
  },
  {
    phase: 'PHASE_F_SIEGE_WALL',
    startTime: 104.0,
    endTime: 122.0,
    title: 'PHASE F — THE SIEGE WALL EMERGENCE',
    shortLabel: 'Siege Wall',
    summary: 'Vast irregular swath of pure starless blackness expands across the sector. Physical sky erased. Containment boundary established.',
    audioCue: 'Eerie vacuum silence, distant stellar death thrums'
  },
  {
    phase: 'PHASE_G_STATION_LOSS',
    startTime: 122.0,
    endTime: 138.0,
    title: 'PHASE G — ORBITAL DESCENT & CONTAINMENT',
    shortLabel: 'Station Loss',
    summary: 'Observation Station HV-88 tumbles past event horizon. All telemetry severed. System status: CONTAINMENT ACHIEVED.',
    audioCue: 'Deep cosmic tone fading into cold silence'
  },
  {
    phase: 'PHASE_H_FORENSIC_REPLAY',
    startTime: 138.0,
    endTime: 138.0,
    title: 'PHASE H — FORENSIC TELEMETRY REPLAY',
    shortLabel: 'Forensic Replay',
    summary: 'Forensic black-box telemetry unlocked. Scrub timeline, inspect exterior angles, and examine celestial collapse data.',
    audioCue: 'Forensic UI scrub clicks and synthetic data tones'
  }
];

export function getPhaseAtTime(time: number): PhaseId {
  if (time >= TOTAL_EXPERIENCE_DURATION) return 'PHASE_H_FORENSIC_REPLAY';
  for (const marker of PHASE_TIMELINE) {
    if (time >= marker.startTime && time < marker.endTime) {
      return marker.phase;
    }
  }
  return 'PHASE_G_STATION_LOSS';
}

export function computeSubsystems(time: number): SubsystemStatus {
  if (time < 16.0) {
    return { lifeSupport: 100, hullIntegrity: 100, orbitalStability: 100, quantumComms: true, radiationShield: 100 };
  } else if (time < 32.0) {
    return { lifeSupport: 100, hullIntegrity: 100, orbitalStability: 98, quantumComms: true, radiationShield: 95 };
  } else if (time < 52.0) {
    return { lifeSupport: 96, hullIntegrity: 100, orbitalStability: 92, quantumComms: true, radiationShield: 88 };
  } else if (time < 78.0) {
    const t = (time - 52.0) / (78.0 - 52.0);
    return {
      lifeSupport: Math.max(20, Math.round(96 - t * 45)),
      hullIntegrity: Math.max(30, Math.round(100 - t * 35)),
      orbitalStability: Math.max(15, Math.round(92 - t * 65)),
      quantumComms: t < 0.7,
      radiationShield: Math.max(0, Math.round(88 - t * 88))
    };
  } else if (time < 104.0) {
    const t = (time - 78.0) / (104.0 - 78.0);
    return {
      lifeSupport: Math.max(5, Math.round(51 - t * 36)),
      hullIntegrity: Math.max(10, Math.round(65 - t * 45)),
      orbitalStability: Math.max(5, Math.round(27 - t * 22)),
      quantumComms: false,
      radiationShield: 0
    };
  } else {
    return { lifeSupport: 0, hullIntegrity: 0, orbitalStability: 0, quantumComms: false, radiationShield: 0 };
  }
}

interface TimelineStoreState {
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  currentPhase: PhaseId;
  isForensicUnlocked: boolean;
  cameraMode: CameraMode;
  tacticalModalOpen: boolean;
  tacticalTab: TacticalTab;
  audioUnlocked: boolean;
  accessibility: AccessibilitySettings;
  activeSubtitle: string | null;

  // Actions
  tick: (delta: number) => void;
  seek: (time: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setPlaybackRate: (rate: number) => void;
  setCameraMode: (mode: CameraMode) => void;
  setTacticalModalOpen: (open: boolean, tab?: TacticalTab) => void;
  unlockAudio: () => void;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  setSubtitle: (text: string | null) => void;
  restart: () => void;
  jumpToPhase: (phase: PhaseId) => void;
}

function getInitialStateFromURL() {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const timeParam = params.get('time');
    const cameraParam = params.get('camera');
    const modalParam = params.get('modal');
    const pausedParam = params.get('paused');

    const time = timeParam !== null ? parseFloat(timeParam) : 0;
    const phase = getPhaseAtTime(time);
    const cameraMode = (cameraParam as CameraMode) || (time >= 122.0 ? 'CINEMATIC' : 'FIRST_PERSON');
    const tacticalModalOpen = modalParam === 'true';
    const isPlaying = pausedParam === 'true' ? false : true;

    return {
      currentTime: time,
      currentPhase: phase,
      cameraMode,
      tacticalModalOpen,
      isPlaying
    };
  } catch {
    return {};
  }
}

const initialURL = getInitialStateFromURL();

export const useTimelineStore = create<TimelineStoreState>((set, get) => ({
  currentTime: initialURL.currentTime ?? 0,
  isPlaying: initialURL.isPlaying ?? true,
  playbackRate: 1.0,
  currentPhase: initialURL.currentPhase ?? 'PHASE_A_NORMAL',
  isForensicUnlocked: (initialURL.currentTime ?? 0) >= TOTAL_EXPERIENCE_DURATION,
  cameraMode: initialURL.cameraMode ?? 'FIRST_PERSON',
  tacticalModalOpen: initialURL.tacticalModalOpen ?? false,
  tacticalTab: 'OVERVIEW',
  audioUnlocked: false,
  activeSubtitle: null,
  accessibility: {
    reducedMotion: false,
    captions: true,
    highContrast: false,
    subtitles: true,
    masterVolume: 0.8,
    fontSize: 'normal'
  },

  tick: (delta: number) => {
    const { isPlaying, playbackRate, currentTime, isForensicUnlocked } = get();
    if (!isPlaying) return;

    const nextTime = currentTime + delta * playbackRate;
    const nextPhase = getPhaseAtTime(nextTime);
    const unlocked = isForensicUnlocked || nextTime >= TOTAL_EXPERIENCE_DURATION;

    if (nextTime >= TOTAL_EXPERIENCE_DURATION) {
      set({
        currentTime: TOTAL_EXPERIENCE_DURATION,
        isPlaying: false,
        currentPhase: 'PHASE_H_FORENSIC_REPLAY',
        isForensicUnlocked: true,
        cameraMode: 'EXTERIOR_INSPECTION'
      });
    } else {
      // Transition camera automatically to cinematic when station loss occurs during live playthrough
      let camMode = get().cameraMode;
      if (nextPhase === 'PHASE_G_STATION_LOSS' && camMode === 'FIRST_PERSON' && !isForensicUnlocked) {
        camMode = 'CINEMATIC';
      }

      set({
        currentTime: nextTime,
        currentPhase: nextPhase,
        isForensicUnlocked: unlocked,
        cameraMode: camMode
      });
    }
  },

  seek: (time: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_EXPERIENCE_DURATION, time));
    const phase = getPhaseAtTime(clamped);
    set({
      currentTime: clamped,
      currentPhase: phase
    });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackRate: (rate: number) => set({ playbackRate: rate }),
  setCameraMode: (mode: CameraMode) => set({ cameraMode: mode }),
  setTacticalModalOpen: (open: boolean, tab: TacticalTab = 'OVERVIEW') => set({ tacticalModalOpen: open, tacticalTab: tab }),
  unlockAudio: () => set({ audioUnlocked: true }),
  updateAccessibility: (settings) => set((state) => ({ accessibility: { ...state.accessibility, ...settings } })),
  setSubtitle: (text: string | null) => set({ activeSubtitle: text }),
  
  restart: () => {
    set({
      currentTime: 0,
      isPlaying: true,
      playbackRate: 1.0,
      currentPhase: 'PHASE_A_NORMAL',
      cameraMode: 'FIRST_PERSON',
      tacticalModalOpen: false,
      tacticalTab: 'OVERVIEW',
      activeSubtitle: null
    });
  },

  jumpToPhase: (phase: PhaseId) => {
    const marker = PHASE_TIMELINE.find((p) => p.phase === phase);
    if (marker) {
      set({
        currentTime: marker.startTime,
        currentPhase: marker.phase
      });
    }
  }
}));
