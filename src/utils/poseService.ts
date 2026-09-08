import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '../types';

let poseLandmarkerInstance: PoseLandmarker | null = null;
let isLoadingPromise: Promise<PoseLandmarker> | null = null;

export async function initializePoseLandmarker(): Promise<PoseLandmarker> {
  if (poseLandmarkerInstance) {
    return poseLandmarkerInstance;
  }
  if (isLoadingPromise) {
    return isLoadingPromise;
  }

  isLoadingPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseLandmarkerInstance = landmarker;
      return landmarker;
    } catch (err) {
      console.error('Failed to initialize MediaPipe Pose Landmarker with GPU, retrying with CPU:', err);
      // Fallback with CPU delegate
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.4,
      });
      poseLandmarkerInstance = landmarker;
      return landmarker;
    }
  })();

  return isLoadingPromise;
}

/**
 * Generates realistic animated pose landmarks for DEMO MODE debugging and showcase.
 * In Basketball mode: cycles arm raising (35° -> 138° -> 35°).
 * In Jump mode: cycles authentic full-body jumping biomechanics (idle -> crouch dip -> spring jump -> landing).
 */
export function generateSimulatedPoseLandmarks(timeMs: number, isJumpingMode = false): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.99,
  }));

  // Calculate dynamic vertical jump offset in jump mode
  let jumpOffset = 0;
  let kneeBend = 0;
  let armJumpSpread = 0;

  if (isJumpingMode) {
    // Jump cycle period: 2.8 seconds (2800ms)
    const cycleTime = timeMs % 2800;

    if (cycleTime < 900) {
      // Phase 1: Standing Idle (0ms to 900ms)
      jumpOffset = 0;
      kneeBend = 0;
    } else if (cycleTime < 1300) {
      // Phase 2: Crouch Anticipation Dip (900ms to 1300ms)
      const crouchProgress = (cycleTime - 900) / 400;
      jumpOffset = Math.sin(crouchProgress * Math.PI) * 0.04; // dip downward (+y)
      kneeBend = Math.sin(crouchProgress * Math.PI) * 0.03;
    } else if (cycleTime < 2200) {
      // Phase 3: Explosive Upward Jump & Airborne Arc (1300ms to 2200ms)
      const jumpProgress = (cycleTime - 1300) / 900;
      // Parabolic jump arc: leaps up by up to -0.16
      jumpOffset = -Math.sin(jumpProgress * Math.PI) * 0.16;
      armJumpSpread = Math.sin(jumpProgress * Math.PI) * 0.08;
      kneeBend = -Math.sin(jumpProgress * Math.PI) * 0.02;
    } else {
      // Phase 4: Landing & Recovery (2200ms to 2800ms)
      const landProgress = (cycleTime - 2200) / 600;
      jumpOffset = Math.sin(landProgress * Math.PI) * 0.02; // slight landing cushion
    }
  }

  // Base coordinates with dynamic jump physics
  const hipY = 0.65 + jumpOffset;
  const shoulderY = 0.35 + jumpOffset;
  const headY = 0.20 + jumpOffset;

  // Head
  landmarks[0] = { x: 0.5, y: headY, z: 0, visibility: 0.99 };

  // Shoulders (11 = Left, 12 = Right in mirrored view)
  const lShoulderX = 0.62;
  const rShoulderX = 0.38;
  landmarks[11] = { x: lShoulderX, y: shoulderY, z: 0, visibility: 0.99 };
  landmarks[12] = { x: rShoulderX, y: shoulderY, z: 0, visibility: 0.99 };

  if (isJumpingMode) {
    // Both arms swing naturally with jump momentum
    landmarks[13] = { x: lShoulderX + 0.06 + armJumpSpread, y: shoulderY + 0.12, z: 0, visibility: 0.99 };
    landmarks[15] = { x: lShoulderX + 0.08 + armJumpSpread * 1.5, y: shoulderY + 0.22 - armJumpSpread, z: 0, visibility: 0.99 };

    landmarks[14] = { x: rShoulderX - 0.06 - armJumpSpread, y: shoulderY + 0.12, z: 0, visibility: 0.99 };
    landmarks[16] = { x: rShoulderX - 0.08 - armJumpSpread * 1.5, y: shoulderY + 0.22 - armJumpSpread, z: 0, visibility: 0.99 };
  } else {
    // Basketball Mode: Right arm raises and lowers smoothly
    const cycle = (Math.sin(timeMs / 600) + 1) / 2; // 0 to 1
    const targetAngleDeg = 40 + cycle * 95; // 40° to 135°
    const rad = (targetAngleDeg * Math.PI) / 180;

    const upperArmLen = 0.15;
    const forearmLen = 0.15;

    // Right elbow (14)
    const rElbowX = rShoulderX - Math.sin(rad) * upperArmLen;
    const rElbowY = shoulderY + Math.cos(rad) * upperArmLen;
    landmarks[14] = { x: rElbowX, y: rElbowY, z: 0, visibility: 0.99 };

    // Right wrist (16)
    const rWristX = rElbowX - Math.sin(rad * 0.95) * forearmLen;
    const rWristY = rElbowY + Math.cos(rad * 0.95) * forearmLen;
    landmarks[16] = { x: rWristX, y: rWristY, z: 0, visibility: 0.99 };

    // Left arm resting at side (13, 15)
    landmarks[13] = { x: lShoulderX + 0.05, y: shoulderY + 0.16, z: 0, visibility: 0.99 };
    landmarks[15] = { x: lShoulderX + 0.06, y: shoulderY + 0.30, z: 0, visibility: 0.99 };
  }

  // Hips (23, 24)
  landmarks[23] = { x: 0.56, y: hipY, z: 0, visibility: 0.99 };
  landmarks[24] = { x: 0.44, y: hipY, z: 0, visibility: 0.99 };

  // Knees (25, 26)
  const kneeY = 0.82 + jumpOffset + kneeBend;
  landmarks[25] = { x: 0.56, y: kneeY, z: 0, visibility: 0.99 };
  landmarks[26] = { x: 0.44, y: kneeY, z: 0, visibility: 0.99 };

  // Ankles (27, 28)
  const ankleY = 0.95 + jumpOffset;
  landmarks[27] = { x: 0.56, y: ankleY, z: 0, visibility: 0.99 };
  landmarks[28] = { x: 0.44, y: ankleY, z: 0, visibility: 0.99 };

  return landmarks;
}
