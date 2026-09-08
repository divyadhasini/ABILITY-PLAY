import React, { useState, useEffect } from 'react';
import { soundEffects } from '../utils/soundEffects';
import { Trophy, Activity, Zap, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface JumpGameProps {
  isJumpTriggered: boolean;
  jumpIntensity: number;
  onSuccessfulJump: () => void;
  jumpScore: number;
}

export const JumpGame: React.FC<JumpGameProps> = ({
  isJumpTriggered,
  jumpIntensity,
  onSuccessfulJump,
  jumpScore,
}) => {
  const [characterY, setCharacterY] = useState(0); // Jump height offset (px)
  const [isJumping, setIsJumping] = useState(false);
  const [starCollected, setStarCollected] = useState(false);

  useEffect(() => {
    if (isJumpTriggered && !isJumping) {
      setIsJumping(true);
      soundEffects.playJump();
      onSuccessfulJump();
      setStarCollected(true);

      // Jump animation
      setCharacterY(-110);

      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#fbbf24', '#a855f7', '#34d399'],
      });

      setTimeout(() => {
        setCharacterY(0);
        setIsJumping(false);
        setTimeout(() => setStarCollected(false), 500);
      }, 650);
    }
  }, [isJumpTriggered, isJumping, onSuccessfulJump]);

  return (
    <div className="relative w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 flex flex-col justify-between p-4">
      {/* Top Status Bar */}
      <div className="relative z-20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
            <Trophy size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Jump Score
            </div>
            <div className="text-xl font-black text-white">{jumpScore} Points</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <Zap size={13} className="text-amber-300 fill-amber-300" />
          <span>Mini-Demo: Jump Engine</span>
        </div>
      </div>

      {/* Track & Jumping Area */}
      <div className="relative flex-1 flex flex-col items-center justify-center my-4">
        {/* Floating Star Target to Catch */}
        <div
          className={`absolute top-12 transition-all duration-300 flex flex-col items-center ${
            starCollected ? 'scale-150 opacity-0' : 'scale-100 opacity-100 animate-pulse'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center shadow-lg shadow-amber-400/30">
            <Sparkles className="w-6 h-6 text-amber-300 fill-amber-300" />
          </div>
          <span className="text-[10px] font-bold text-amber-300 mt-1 uppercase tracking-wider">
            Jump to collect star!
          </span>
        </div>

        {/* Mascot / Runner Character */}
        <div
          className="absolute bottom-12 transition-transform ease-out duration-300 flex flex-col items-center"
          style={{ transform: `translateY(${characterY}px)` }}
        >
          {/* Energy Ring */}
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl border-2 border-white/80 transition-all ${
              isJumping ? 'shadow-cyan-400/70 scale-110' : 'shadow-blue-500/30'
            }`}
          >
            <span className="text-2xl select-none">{isJumping ? '🚀' : '🏃'}</span>
          </div>

          {/* Shadow under character */}
          <div
            className={`w-12 h-2 rounded-full bg-slate-950/60 mt-2 blur-[2px] transition-all duration-300 ${
              isJumping ? 'scale-50 opacity-20' : 'scale-100 opacity-70'
            }`}
          />
        </div>

        {/* Floor Line */}
        <div className="absolute bottom-10 inset-x-8 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent rounded-full" />
      </div>

      {/* Bottom Jump Metrics Bar */}
      <div className="relative z-20 bg-slate-900/85 backdrop-blur-md rounded-xl p-3 border border-slate-700/60 shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity size={14} className="text-purple-400" />
            <span>Vertical Hip & Shoulder Jump Detection</span>
          </div>
          <span className={isJumping ? 'text-emerald-400 font-bold animate-pulse' : 'text-slate-400'}>
            {isJumping ? '🌟 JUMP DETECTED (+10 PTS)!' : 'Stand still or Jump to Score'}
          </span>
        </div>

        {/* Live Vertical Intensity Meter */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-75"
            style={{ width: `${Math.min(100, Math.round(jumpIntensity * 100))}%` }}
          />
        </div>

        <div className="text-[11px] text-slate-400 text-center italic">
          Multi-joint velocity filter • Standing still will not trigger false jumps
        </div>
      </div>
    </div>
  );
};
