import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AdaptiveGameParameters, SessionStats } from '../types';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { Trophy, Target, Flame, Sparkles } from 'lucide-react';

interface BasketballGameProps {
  gameParams: AdaptiveGameParameters;
  sessionStats: SessionStats;
  currentAngle: number;
  isTriggered: boolean;
  onSuccessfulShot: (angle: number) => void;
  personalBaseline: number;
}

export const BasketballGame: React.FC<BasketballGameProps> = ({
  gameParams,
  sessionStats,
  currentAngle,
  isTriggered,
  onSuccessfulShot,
  personalBaseline,
}) => {
  const [isShooting, setIsShooting] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 82 }); // % of court
  const [scorePopup, setScorePopup] = useState<{ show: boolean; text: string; id: number } | null>(
    null
  );
  const [netSwishAnim, setNetSwishAnim] = useState(false);
  const courtRef = useRef<HTMLDivElement | null>(null);

  // Trigger shot when arm raise is detected
  const executeShot = useCallback(() => {
    if (isShooting) return;

    setIsShooting(true);
    soundEffects.playShotLaunch();

    // Hoop coordinates in percentage
    const hoopTargetX = 50;
    const hoopTargetY = gameParams.targetHeightPercent + 4; // Target center

    // Animate ball arc towards the adaptive hoop
    const startTime = performance.now();
    const duration = gameParams.gameSpeedMs;

    const startX = 50;
    const startY = 82;

    const animateFlight = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Parabolic arc interpolation
      const currentX = startX + (hoopTargetX - startX) * progress;
      const arcHeight = 28; // Arc upward curvature
      const linearY = startY + (hoopTargetY - startY) * progress;
      const arcY = linearY - Math.sin(progress * Math.PI) * arcHeight;

      setBallPosition({ x: currentX, y: arcY });

      if (progress < 1) {
        requestAnimationFrame(animateFlight);
      } else {
        // Swish! Reached hoop
        setNetSwishAnim(true);
        soundEffects.playSwishScore();

        // Celebration confetti burst
        if (courtRef.current) {
          const rect = courtRef.current.getBoundingClientRect();
          const originX = (rect.left + rect.width * 0.5) / window.innerWidth;
          const originY = (rect.top + rect.height * (gameParams.targetHeightPercent / 100)) / window.innerHeight;

          confetti({
            particleCount: 28,
            spread: 50,
            origin: { x: originX, y: originY },
            colors: ['#38bdf8', '#fbbf24', '#34d399', '#f472b6'],
            ticks: 80,
            gravity: 0.8,
          });
        }

        setScorePopup({
          show: true,
          text: currentAngle >= personalBaseline ? 'PERFECT STRETCH! +1' : 'SWISH! +1',
          id: Date.now(),
        });

        onSuccessfulShot(currentAngle);

        // Reset ball back to launch stance after short celebration
        setTimeout(() => {
          setNetSwishAnim(false);
          setBallPosition({ x: 50, y: 82 });
          setIsShooting(false);
        }, 550);
      }
    };

    requestAnimationFrame(animateFlight);
  }, [isShooting, gameParams, currentAngle, personalBaseline, onSuccessfulShot]);

  useEffect(() => {
    if (isTriggered && !isShooting) {
      executeShot();
    }
  }, [isTriggered, isShooting, executeShot]);

  // Clean score popup after animation
  useEffect(() => {
    if (scorePopup) {
      const timer = setTimeout(() => setScorePopup(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [scorePopup]);

  const thresholdPercent = Math.min(
    100,
    Math.round((currentAngle / gameParams.successThresholdAngle) * 100)
  );

  return (
    <div
      ref={courtRef}
      className="relative w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-gradient-to-b from-slate-900 via-sky-950/40 to-slate-950 flex flex-col justify-between p-4"
    >
      {/* Court Background Aesthetics */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {/* Basketball key / floor lines */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-64 border-x-2 border-b-2 border-sky-400/40 rounded-b-3xl" />
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-32 h-32 border-2 border-sky-400/40 rounded-full" />
      </div>

      {/* Top Game Status Bar */}
      <div className="relative z-20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
            <Trophy size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Score
            </div>
            <div className="text-xl font-black text-white flex items-center gap-1.5">
              <span>{sessionStats.score}</span>
              {sessionStats.currentStreak > 1 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-0.5">
                  <Flame size={11} /> {sessionStats.currentStreak}x Streak
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Adaptive Challenge Level Badge */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            <Sparkles size={13} className="text-amber-300" />
            <span>{gameParams.levelLabel.split(':')[0]}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Target Size: {gameParams.targetSize}px • Baseline: {personalBaseline}°
          </div>
        </div>
      </div>

      {/* ADAPTIVE BASKETBALL HOOP / TARGET */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10 transition-all duration-700 flex flex-col items-center pointer-events-none"
        style={{
          top: `${gameParams.targetHeightPercent}%`,
          width: `${gameParams.targetSize + 40}px`,
        }}
      >
        {/* Backboard */}
        <div className="w-full h-16 bg-slate-900/80 backdrop-blur-md border-2 border-sky-400/60 rounded-xl shadow-lg flex items-center justify-center relative">
          <div className="w-1/2 h-8 border border-sky-300/60 rounded-md" />
          {/* Target Indicator Glow */}
          <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-emerald-300">
            {gameParams.successThresholdAngle}° Trigger
          </div>
        </div>

        {/* Rim & Net */}
        <div className="relative flex flex-col items-center -mt-1">
          {/* Orange Rim */}
          <div
            className="h-3 rounded-full bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 shadow-md shadow-orange-500/50 border border-orange-300"
            style={{ width: `${gameParams.targetSize}px` }}
          />

          {/* Net (Animated Swish Effect) */}
          <div
            className={`transition-transform duration-200 origin-top flex flex-col items-center ${
              netSwishAnim ? 'scale-y-125 scale-x-90 text-sky-200' : 'text-slate-300'
            }`}
          >
            <svg
              width={gameParams.targetSize}
              height="40"
              viewBox="0 0 80 40"
              className="opacity-75 stroke-current fill-none stroke-[1.5]"
            >
              <path d="M 0,0 L 20,40 L 40,0 L 60,40 L 80,0" />
              <path d="M 10,0 L 30,40 L 50,0 L 70,40" />
              <line x1="5" y1="12" x2="75" y2="12" strokeDasharray="3 3" />
              <line x1="12" y1="26" x2="68" y2="26" strokeDasharray="3 3" />
            </svg>
          </div>
        </div>
      </div>

      {/* FLOATING SCORE POPUP */}
      {scorePopup && (
        <div
          key={scorePopup.id}
          className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce"
          style={{ top: `${Math.max(10, gameParams.targetHeightPercent - 8)}%` }}
        >
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-emerald-500/40 border border-white/60 uppercase tracking-wide">
            {scorePopup.text}
          </div>
        </div>
      )}

      {/* BASKETBALL (Animated physics or resting at base) */}
      <div
        className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
        style={{
          left: `${ballPosition.x}%`,
          top: `${ballPosition.y}%`,
        }}
      >
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 shadow-xl shadow-orange-500/40 border-2 border-orange-700 flex items-center justify-center relative ${
            isShooting ? 'animate-spin' : 'animate-pulse'
          }`}
          style={{ animationDuration: isShooting ? '0.4s' : '3s' }}
        >
          {/* Basketball Seams */}
          <div className="absolute inset-x-0 h-0.5 bg-orange-950/60" />
          <div className="absolute inset-y-0 w-0.5 bg-orange-950/60" />
          <div className="w-10 h-10 rounded-full border border-orange-950/40" />
        </div>
      </div>

      {/* BOTTOM REAL-TIME REHABILITATION INTERACTION BAR */}
      <div className="relative z-20 bg-slate-900/85 backdrop-blur-md rounded-xl p-3 border border-slate-700/60 shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Target size={14} className="text-sky-400" />
            <span>Raise Arm to Shoot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current: {currentAngle}°</span>
            <span className="text-emerald-400">Need: {gameParams.successThresholdAngle}°</span>
          </div>
        </div>

        {/* Stretch Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              thresholdPercent >= 100
                ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300 shadow-md shadow-emerald-400'
                : 'bg-gradient-to-r from-blue-600 to-sky-400'
            }`}
            style={{ width: `${thresholdPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Reps: <strong className="text-white">{sessionStats.successfulActions}</strong> /{' '}
            {gameParams.repsGoal}
          </span>
          <span className="italic">
            {thresholdPercent >= 100
              ? '🎯 HOLD & SHOOTING!'
              : `Stretch +${Math.max(0, gameParams.successThresholdAngle - currentAngle)}° to score`}
          </span>
        </div>
      </div>
    </div>
  );
};
