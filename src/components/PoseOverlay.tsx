import React, { useEffect, useRef } from 'react';
import type { NormalizedLandmark, JointAngleData } from '../types';
import { POSE_LANDMARKS } from '../utils/poseMath';

interface PoseOverlayProps {
  landmarks: NormalizedLandmark[] | null;
  angleData: JointAngleData | null;
  thresholdAngle: number;
  width: number;
  height: number;
  isMirrored?: boolean;
}

const POSE_CONNECTIONS: [number, number][] = [
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  // Left Arm
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  // Right Arm
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  // Left Leg
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  // Right Leg
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
];

export const PoseOverlay: React.FC<PoseOverlayProps> = ({
  landmarks,
  angleData,
  thresholdAngle,
  width,
  height,
  isMirrored = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (!landmarks || landmarks.length === 0) return;

    // Coordinate helper accounting for video mirroring
    const getX = (x: number) => (isMirrored ? (1 - x) * width : x * width);
    const getY = (y: number) => y * height;

    const isAboveThreshold = angleData ? angleData.activeAngle >= thresholdAngle : false;
    const activeArm = angleData?.activeSide || 'right';

    // 1. Draw Skeleton Connections (Bones)
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      if (!p1 || !p2) return;
      if (p1.visibility !== undefined && p1.visibility < 0.3) return;
      if (p2.visibility !== undefined && p2.visibility < 0.3) return;

      const isArmConnection =
        (startIdx === POSE_LANDMARKS.LEFT_SHOULDER && endIdx === POSE_LANDMARKS.LEFT_ELBOW) ||
        (startIdx === POSE_LANDMARKS.LEFT_ELBOW && endIdx === POSE_LANDMARKS.LEFT_WRIST) ||
        (startIdx === POSE_LANDMARKS.RIGHT_SHOULDER && endIdx === POSE_LANDMARKS.RIGHT_ELBOW) ||
        (startIdx === POSE_LANDMARKS.RIGHT_ELBOW && endIdx === POSE_LANDMARKS.RIGHT_WRIST);

      const isActiveArmConnection =
        (activeArm === 'left' &&
          (startIdx === POSE_LANDMARKS.LEFT_SHOULDER || startIdx === POSE_LANDMARKS.LEFT_ELBOW)) ||
        (activeArm === 'right' &&
          (startIdx === POSE_LANDMARKS.RIGHT_SHOULDER || startIdx === POSE_LANDMARKS.RIGHT_ELBOW));

      ctx.beginPath();
      ctx.moveTo(getX(p1.x), getY(p1.y));
      ctx.lineTo(getX(p2.x), getY(p2.y));

      if (isActiveArmConnection && isAboveThreshold) {
        ctx.strokeStyle = '#22c55e'; // Green when successful
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 6;
      } else if (isActiveArmConnection) {
        ctx.strokeStyle = '#38bdf8'; // Sky blue for active arm
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 5;
      } else if (isArmConnection) {
        ctx.strokeStyle = '#60a5fa';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 4;
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.shadowBlur = 0;
        ctx.lineWidth = 3;
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // Reset
    });

    // 2. Draw Landmark Joint Nodes
    const TRACKED_KEY_POINTS = [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ];

    TRACKED_KEY_POINTS.forEach((idx) => {
      const p = landmarks[idx];
      if (!p) return;
      if (p.visibility !== undefined && p.visibility < 0.3) return;

      const x = getX(p.x);
      const y = getY(p.y);

      const isTargetActiveJoint =
        (activeArm === 'left' &&
          (idx === POSE_LANDMARKS.LEFT_SHOULDER || idx === POSE_LANDMARKS.LEFT_ELBOW || idx === POSE_LANDMARKS.LEFT_WRIST)) ||
        (activeArm === 'right' &&
          (idx === POSE_LANDMARKS.RIGHT_SHOULDER || idx === POSE_LANDMARKS.RIGHT_ELBOW || idx === POSE_LANDMARKS.RIGHT_WRIST));

      // Outer glow circle
      ctx.beginPath();
      ctx.arc(x, y, isTargetActiveJoint ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isTargetActiveJoint
        ? isAboveThreshold
          ? '#22c55e'
          : '#38bdf8'
        : '#f8fafc';
      ctx.shadowColor = isTargetActiveJoint ? (isAboveThreshold ? '#22c55e' : '#38bdf8') : '#94a3b8';
      ctx.shadowBlur = isTargetActiveJoint ? 14 : 4;
      ctx.fill();

      // Inner white core
      ctx.beginPath();
      ctx.arc(x, y, isTargetActiveJoint ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fill();
    });

    // 3. Draw Shoulder Angle Arc & Numeric HUD Badge
    if (angleData) {
      const shoulderIdx =
        activeArm === 'left' ? POSE_LANDMARKS.LEFT_SHOULDER : POSE_LANDMARKS.RIGHT_SHOULDER;
      const shoulderPt = landmarks[shoulderIdx];

      if (shoulderPt && (shoulderPt.visibility === undefined || shoulderPt.visibility >= 0.4)) {
        const sx = getX(shoulderPt.x);
        const sy = getY(shoulderPt.y);

        // Draw Angle Badge above active shoulder
        const badgeX = activeArm === 'left' ? sx - 65 : sx + 15;
        const badgeY = sy - 25;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = isAboveThreshold ? '#22c55e' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY - 18, 68, 24, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isAboveThreshold ? '#4ade80' : '#e0f2fe';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${angleData.activeAngle}°`, badgeX + 34, badgeY - 2);

        // Draw decorative subtle target threshold arc
        ctx.beginPath();
        ctx.arc(sx, sy, 32, 0, Math.PI * 2);
        ctx.strokeStyle = isAboveThreshold ? 'rgba(34, 197, 94, 0.4)' : 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]); // Reset
      }
    }
  }, [landmarks, angleData, thresholdAngle, width, height, isMirrored]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full object-cover"
    />
  );
};
