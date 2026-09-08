import { NormalizedLandmark, JointAngleData } from '../types';

export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

/**
 * Calculates the interior 2D angle (in degrees) at vertex point B between vectors BA and BC.
 * @param a First point (e.g., Shoulder)
 * @param b Vertex point (e.g., Elbow)
 * @param c Third point (e.g., Wrist)
 * @returns Angle in degrees [0, 180]
 */
export function calculateAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  if (!a || !b || !c) return 0;

  // Vector BA
  const vBA = { x: a.x - b.x, y: a.y - b.y };
  // Vector BC
  const vBC = { x: c.x - b.x, y: c.y - b.y };

  const dotProduct = vBA.x * vBC.x + vBA.y * vBC.y;
  const magBA = Math.sqrt(vBA.x * vBA.x + vBA.y * vBA.y);
  const magBC = Math.sqrt(vBC.x * vBC.x + vBC.y * vBC.y);

  if (magBA === 0 || magBC === 0) return 0;

  let cosTheta = dotProduct / (magBA * magBC);
  // Clamp between -1 and 1 to prevent NaN from floating point precision issues
  cosTheta = Math.max(-1, Math.min(1, cosTheta));

  const radians = Math.acos(cosTheta);
  return Math.round((radians * 180) / Math.PI);
}

/**
 * Calculates shoulder elevation angle relative to the torso (Hip -> Shoulder -> Elbow/Wrist).
 * When arm is by side, angle is ~15-30°. Raised horizontally = ~90°. Raised up = 140-180°.
 */
export function calculateShoulderElevation(
  hip: NormalizedLandmark,
  shoulder: NormalizedLandmark,
  elbow: NormalizedLandmark
): number {
  if (!hip || !shoulder || !elbow) return 0;
  return calculateAngle(hip, shoulder, elbow);
}

/**
 * Extracts and calculates all joint angles from landmarks.
 */
export function computeJointAngles(landmarks: NormalizedLandmark[]): JointAngleData | null {
  if (!landmarks || landmarks.length < 29) return null;

  const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const lElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const rElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  const lWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
  const rWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
  const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  // Primary shoulder angles (Torso to arm abduction/elevation)
  const leftElevation = calculateShoulderElevation(lHip, lShoulder, lElbow);
  const rightElevation = calculateShoulderElevation(rHip, rShoulder, rElbow);

  // Arm joint angles (Shoulder -> Elbow -> Wrist)
  const leftElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
  const rightElbowAngle = calculateAngle(rShoulder, rElbow, rWrist);

  // Determine active arm by which arm is raised higher or has greater elevation
  const activeSide: 'left' | 'right' = rightElevation >= leftElevation ? 'right' : 'left';
  const activeAngle = activeSide === 'right' ? rightElevation : leftElevation;

  return {
    leftArmAngle: leftElevation,
    rightArmAngle: rightElevation,
    activeAngle,
    leftElbowAngle,
    rightElbowAngle,
    activeSide,
  };
}

/**
 * Checks if key landmarks are sufficiently visible in the camera frame.
 */
export function checkUserInFrame(landmarks: NormalizedLandmark[] | null): boolean {
  if (!landmarks || landmarks.length < 25) return false;

  const requiredIndices = [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
  ];

  for (const idx of requiredIndices) {
    const pt = landmarks[idx];
    if (!pt) return false;
    // Normalized coordinates must be roughly within [0.05, 0.95]
    if (pt.x < 0.02 || pt.x > 0.98 || pt.y < 0.02 || pt.y > 0.98) return false;
    if (pt.visibility !== undefined && pt.visibility < 0.4) return false;
  }

  return true;
}
