import React, { useEffect } from 'react';
import type { SessionStats } from '../types';
import { calculateSessionPerformance } from '../utils/adaptiveEngine';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ShieldAlert } from 'lucide-react';

interface ResultsCardProps {
  isOpen: boolean;
  onClose: () => void;
  sessionStats: SessionStats;
  personalBaseline: number;
  onPlayAgain: () => void;
}

export const ResultsCard: React.FC<ResultsCardProps> = ({
  isOpen,
  sessionStats,
  personalBaseline,
  onPlayAgain,
}) => {
  const performance = calculateSessionPerformance(
    sessionStats.bestMovementAngle,
    personalBaseline,
    sessionStats.totalRepetitions,
    sessionStats.successfulActions
  );

  useEffect(() => {
    if (isOpen) {
      soundEffects.playFanfare();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#818cf8'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 text-white overflow-hidden">
        {/* Top Celebration Badge */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-emerald-500/30 text-slate-950">
            <Trophy className="w-9 h-9" />
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
            Session Complete 🎉
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 bg-gradient-to-r from-white via-sky-100 to-indigo-200 bg-clip-text text-transparent">
            Great Movement Work!
          </h2>
        </div>

        {/* Highlighted Progress Statement */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-blue-900/40 border border-indigo-500/40 text-center mb-6 shadow-lg">
          <p className="text-base sm:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-amber-200 to-emerald-300">
            "{performance.summaryText}"
          </p>
        </div>

        {/* 6 Grid Metrics Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
          {/* Total Repetitions */}
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-400 font-medium">Total Repetitions</div>
            <div className="text-xl font-black text-white mt-1">
              {sessionStats.totalRepetitions}
            </div>
          </div>

          {/* Successful Actions */}
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-400 font-medium">Successful Actions</div>
            <div className="text-xl font-black text-emerald-300 mt-1">
              {sessionStats.successfulActions}
            </div>
          </div>

          {/* Success Rate */}
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-400 font-medium">Success Rate</div>
            <div className="text-xl font-black text-cyan-300 mt-1">
              {performance.successRate}%
            </div>
          </div>

          {/* Personal Baseline */}
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-400 font-medium">Personal Baseline</div>
            <div className="text-xl font-black text-amber-300 mt-1">
              {personalBaseline}°
            </div>
          </div>

          {/* Best Movement */}
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-400 font-medium">Best Movement</div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {sessionStats.bestMovementAngle > 0 ? `${sessionStats.bestMovementAngle}°` : `${personalBaseline}°`}
            </div>
          </div>

          {/* Challenge Level */}
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-400 font-medium">Challenge Level</div>
            <div className="text-xl font-black text-indigo-300 mt-1">
              Level {sessionStats.challengeLevel}
            </div>
          </div>
        </div>

        {/* Disclaimer / Prototype Notice */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2 mb-6">
          <ShieldAlert size={14} className="shrink-0 text-slate-500 mt-0.5" />
          <span>
            Prototype visualization for demonstration purposes. This system is designed as an engaging motivational game interface and does not constitute a diagnostic medical claim.
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onPlayAgain}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-xl shadow-blue-500/30 transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          <span>Play Another Session</span>
        </button>
      </div>
    </div>
  );
};
