import { NormalizedLandmark } from '../types';
import { POSE_LANDMARKS, computeJointAngles } from './poseMath';

export interface ArmRaiseDetection {
  triggered: boolean;
  angle: number;
  threshold: number;
  side: 'left' | 'right';
  progress: number; // 0 to 1
}

export interface JumpDetection {
  triggered: boolean;
  intensity: number; // 0 to 1
  jumpHeight: number;
  state: 'idle' | 'takeoff' | 'airborne' | 'landing';
}

export class MovementDetector {
  // Arm raise tracking
  private lastTriggerTime = 0;
  private cooldownMs = 1200; // Prevent accidental double-triggers
  private consecutiveFramesAboveThreshold = 0;
  private requiredConsecutiveFrames = 3; // ~100ms at 30fps

  // Jump tracking state machine
  private jumpState: 'idle' | 'takeoff' | 'airborne' | 'landing' = 'idle';
  private restingHipY: number | null = null;
  private restingShoulderY: number | null = null;
  private restingAnkleY: number | null = null;
  private lastJumpTime = 0;
  private jumpCooldownMs = 1200;
  private prevHipY: number | null = null;
  private prevTimestamp: number = 0;
  private stableFrameCount = 0;
  private peakJumpDisplacement = 0;

  /**
   * Evaluates arm raise based on the child's dynamic shoulder/arm angle and adaptive threshold.
   */
  public evaluateArmRaise(
    landmarks: NormalizedLandmark[],
    successThresholdAngle: number
  ): ArmRaiseDetection {
    const angleData = computeJointAngles(landmarks);
    if (!angleData) {
      return {
        triggered: false,
        angle: 0,
        threshold: successThresholdAngle,
        side: 'right',
        progress: 0,
      };
    }

    const { activeAngle, activeSide } = angleData;
    const now = performance.now();
    const progress = Math.min(1, Math.max(0, activeAngle / successThresholdAngle));

    // Check if arm angle exceeds the adaptive threshold
    if (activeAngle >= successThresholdAngle) {
      this.consecutiveFramesAboveThreshold++;
    } else {
      this.consecutiveFramesAboveThreshold = Math.max(0, this.consecutiveFramesAboveThreshold - 1);
    }

    const isSustained = this.consecutiveFramesAboveThreshold >= this.requiredConsecutiveFrames;
    const isOffCooldown = now - this.lastTriggerTime > this.cooldownMs;

    let triggered = false;
    if (isSustained && isOffCooldown) {
      triggered = true;
      this.lastTriggerTime = now;
      this.consecutiveFramesAboveThreshold = 0; // Reset
    }

    return {
      triggered,
      angle: activeAngle,
      threshold: successThresholdAngle,
      side: activeSide,
      progress,
    };
  }

  /**
   * Evaluates genuine physical body jump movements using a robust kinematic state machine.
   * Prevents false triggers while standing still by verifying:
   * 1. Multi-joint coherence (both hips and shoulders move up together)
   * 2. Rapid upward vertical velocity (dy/dt)
   * 3. Sufficient vertical displacement threshold (> 6.5% of frame)
   * 4. State transition: IDLE -> TAKEOFF -> AIRBORNE -> LANDING
   */
  public evaluateJump(landmarks: NormalizedLandmark[]): JumpDetection {
    if (!landmarks || landmarks.length < 29) {
      return { triggered: false, intensity: 0, jumpHeight: 0, state: this.jumpState };
    }

    const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

    if (!lHip || !rHip || !lShoulder || !rShoulder) {
      return { triggered: false, intensity: 0, jumpHeight: 0, state: this.jumpState };
    }

    const currentHipY = (lHip.y + rHip.y) / 2;
    const currentShoulderY = (lShoulder.y + rShoulder.y) / 2;
    const now = performance.now();
    const dt = this.prevTimestamp > 0 ? (now - this.prevTimestamp) / 1000 : 0.033;
    this.prevTimestamp = now;

    // Initialize resting baseline when starting
    if (this.restingHipY === null || this.restingShoulderY === null) {
      this.restingHipY = currentHipY;
      this.restingShoulderY = currentShoulderY;
      this.prevHipY = currentHipY;
      return { triggered: false, intensity: 0, jumpHeight: 0, state: 'idle' };
    }

    // Upward displacement from baseline (In screen coordinates, smaller Y = higher position)
    const hipUpwardDisplacement = this.restingHipY - currentHipY;
    const shoulderUpwardDisplacement = this.restingShoulderY - currentShoulderY;
    const avgDisplacement = (hipUpwardDisplacement + shoulderUpwardDisplacement) / 2;

    // Calculate vertical velocity (negative means moving UP rapidly)
    const deltaHipY = this.prevHipY !== null ? currentHipY - this.prevHipY : 0;
    const verticalVelocity = dt > 0 ? deltaHipY / dt : 0;
    this.prevHipY = currentHipY;

    // Cooldown check
    const isOffCooldown = now - this.lastJumpTime > this.jumpCooldownMs;

    let triggered = false;

    // State Machine
    if (this.jumpState === 'idle') {
      // While idle, slowly adapt resting baseline to accommodate natural posture shifts
      if (Math.abs(avgDisplacement) < 0.03) {
        this.stableFrameCount++;
        this.restingHipY = this.restingHipY * 0.96 + currentHipY * 0.04;
        this.restingShoulderY = this.restingShoulderY * 0.96 + currentShoulderY * 0.04;
      }

      // Trigger transition to TAKEOFF only if rapid upward velocity occurs
      // (verticalVelocity < -0.35 means moving upward fast)
      if (isOffCooldown && verticalVelocity < -0.30 && avgDisplacement > 0.025) {
        this.jumpState = 'takeoff';
        this.peakJumpDisplacement = avgDisplacement;
      }
    } else if (this.jumpState === 'takeoff') {
      this.peakJumpDisplacement = Math.max(this.peakJumpDisplacement, avgDisplacement);

      // Transition to AIRBORNE when significant displacement threshold (> 6% of screen) is confirmed
      if (avgDisplacement >= 0.06) {
        this.jumpState = 'airborne';
        triggered = true; // Award point and jump animation!
        this.lastJumpTime = now;
      } else if (verticalVelocity > 0.15 || avgDisplacement <= 0.01) {
        // False alarm or aborted motion - return to idle
        this.jumpState = 'idle';
      }
    } else if (this.jumpState === 'airborne') {
      this.peakJumpDisplacement = Math.max(this.peakJumpDisplacement, avgDisplacement);

      // When body starts descending downwards
      if (verticalVelocity > 0.10 || avgDisplacement < this.peakJumpDisplacement * 0.7) {
        this.jumpState = 'landing';
      }
    } else if (this.jumpState === 'landing') {
      // Return to idle when body returns near resting baseline
      if (avgDisplacement <= 0.035 && isOffCooldown) {
        this.jumpState = 'idle';
        this.peakJumpDisplacement = 0;
      }
    }

    const intensity = Math.min(1, Math.max(0, avgDisplacement / 0.12));

    return {
      triggered,
      intensity,
      jumpHeight: Math.max(0, avgDisplacement),
      state: this.jumpState,
    };
  }

  public reset(): void {
    this.lastTriggerTime = 0;
    this.consecutiveFramesAboveThreshold = 0;
    this.restingHipY = null;
    this.restingShoulderY = null;
    this.restingAnkleY = null;
    this.lastJumpTime = 0;
    this.prevHipY = null;
    this.prevTimestamp = 0;
    this.jumpState = 'idle';
    this.stableFrameCount = 0;
    this.peakJumpDisplacement = 0;
  }
}
