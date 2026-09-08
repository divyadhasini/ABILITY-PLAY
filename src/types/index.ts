export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface JointAngleData {
  leftArmAngle: number;
  rightArmAngle: number;
  activeAngle: number;
  leftElbowAngle: number;
  rightElbowAngle: number;
  activeSide: 'left' | 'right';
  leftKneeAngle: number;
  rightKneeAngle: number;
  activeKneeAngle: number;
}

export interface PersonalBaseline {
  maxShoulderAngle: number;
  calibratedAt: number;
  samples: number[];
  isCalibrated: boolean;
}

export interface AdaptiveGameParameters {
  targetSize: number; // in px
  targetHeightPercent: number; // 0 to 100 (% from top)
  targetDistance: 'close' | 'medium' | 'far';
  gameSpeedMs: number; // duration of shot animation
  successThresholdAngle: number; // minimum degrees needed to trigger action
  challengeLevel: number; // 1 to 4
  levelLabel: string;
  repsGoal: number;
}

export interface SessionStats {
  totalRepetitions: number;
  successfulActions: number;
  score: number;
  bestMovementAngle: number;
  currentStreak: number;
  bestStreak: number;
  baselineAngle: number;
  challengeLevel: number;
  repetitionHistory: {
    id: string;
    timestamp: number;
    angle: number;
    success: boolean;
    type: 'shot' | 'jump';
  }[];
}

export type AppMode = 'basketball' | 'jump';
export type AppPhase = 'landing' | 'calibrating' | 'playing' | 'results';

export interface CameraState {
  hasPermission: boolean;
  isStreaming: boolean;
  isLoadingModel: boolean;
  modelReady: boolean;
  errorMessage: string | null;
  userInFrame: boolean;
  fps: number;
  demoMode: boolean;
}
