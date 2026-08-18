export type PhaseId =
  | 'PHASE_A_NORMAL'
  | 'PHASE_B_AUREAL_ALERT'
  | 'PHASE_C_SHARD_GOD_AUTHORITY'
  | 'PHASE_D_HELIOCIDE'
  | 'PHASE_E_CASCADE'
  | 'PHASE_F_SIEGE_WALL'
  | 'PHASE_G_STATION_LOSS'
  | 'PHASE_H_FORENSIC_REPLAY';

export type CameraMode =
  | 'FIRST_PERSON'
  | 'EXTERIOR_INSPECTION'
  | 'ORBIT_OBSERVATORY'
  | 'CINEMATIC';

export type TacticalTab =
  | 'OVERVIEW'
  | 'CLUSTER_MAP'
  | 'SHARD_GOD_DOSSIER'
  | 'TACTICAL_LOGS';

export interface NPCState {
  id: string;
  name: string;
  role: string;
  position: [number, number, number];
  rotation: number;
  currentTask: string;
  evacuationProgress: number; // 0 to 1
  dialogueCue?: string;
}

export interface PhaseMarker {
  phase: PhaseId;
  startTime: number;
  endTime: number;
  title: string;
  shortLabel: string;
  summary: string;
  audioCue?: string;
}

export interface SubsystemStatus {
  lifeSupport: number;       // 0 to 100
  hullIntegrity: number;     // 0 to 100
  orbitalStability: number;  // 0 to 100
  quantumComms: boolean;
  radiationShield: number;   // 0 to 100
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  captions: boolean;
  highContrast: boolean;
  subtitles: boolean;
  masterVolume: number;
  fontSize: 'normal' | 'large';
}
