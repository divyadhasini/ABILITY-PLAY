import React from 'react';
import type { AdaptiveGameParameters, SessionStats, JointAngleData } from '../types';
import { Trophy, Target, Flame, Zap, Compass, ChevronRight } from 'lucide-react';

interface MetricsPanelProps {
  gameParams: AdaptiveGameParameters;
  sessionStats: SessionStats;
  angleData: JointAngleData | null;
  personalBaseline: number;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  gameParams,
  sessionStats,
  angleData,
  personalBaseline,
}) => {
  const activeAngle = angleData ? angleData.activeAngle : 0;
  const progressRatio = Math.min(100, Math.round((activeAngle / gameParams.successThresholdAngle) * 100));

  return (
    <div className="w-full flex flex-col gap-3.5">
      {/* Top Main Metrics Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">
              Live Movement Engine
            </h3>
            <p className="text-xs text-slate-400">Continuous Biomechanical Telemetry</p>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Feed</span>
          </div>
        </div>

        {/* 4 Stat Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Live Shoulder Angle */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Compass size={14} className="text-sky-400" />
              <span>Shoulder Angle</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-sky-300">{activeAngle}°</span>
              <span className="text-[10px] text-slate-400">({angleData?.activeSide || 'arm'})</span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 rounded-full transition-all duration-150"
                style={{ width: `${Math.min(100, (activeAngle / 180) * 100)}%` }}
              />
            </div>
          </div>

          {/* Personal Baseline */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Flame size={14} className="text-orange-400" />
              <span>Personal Baseline</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-300">{personalBaseline}°</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              Custom Range of Motion
            </div>
          </div>

          {/* Challenge Level */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Zap size={14} className="text-amber-400" />
              <span>Challenge Level</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-white">
                Level {gameParams.challengeLevel}
              </span>
            </div>
            <div className="text-[10px] text-indigo-300 mt-2 font-medium truncate">
              {gameParams.levelLabel.split(':')[1] || 'Adaptive'}
            </div>
          </div>

          {/* Successful Repetitions */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Trophy size={14} className="text-emerald-400" />
              <span>Repetitions</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-300">
                {sessionStats.successfulActions}
              </span>
              <span className="text-xs text-slate-400">/ {sessionStats.totalRepetitions} total</span>
            </div>
            <div className="text-[10px] text-emerald-400/90 mt-2 font-medium">
              {sessionStats.totalRepetitions > 0
                ? `${Math.round((sessionStats.successfulActions / sessionStats.totalRepetitions) * 100)}% Accuracy`
                : 'Ready'}
            </div>
          </div>
        </div>

        {/* Adaptive Threshold Target Indicator */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-sky-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Movement Trigger Goal</div>
              <div className="text-[11px] text-slate-400">
                Raise arm to <strong className="text-sky-300">{gameParams.successThresholdAngle}°</strong> to execute basketball throw
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-sm font-bold text-sky-300">{progressRatio}%</span>
          </div>
        </div>
      </div>

      {/* CORE PHILOSOPHY PIPELINE BANNER */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 shadow-md flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-300 overflow-x-auto whitespace-nowrap gap-1">
        <span className="text-sky-400 flex items-center gap-0.5">MOVE <ChevronRight size={12} className="text-slate-500" /></span>
        <span className="text-cyan-300 flex items-center gap-0.5">UNDERSTAND <ChevronRight size={12} className="text-slate-500" /></span>
        <span className="text-amber-300 flex items-center gap-0.5">ADAPT <ChevronRight size={12} className="text-slate-500" /></span>
        <span className="text-emerald-400 flex items-center gap-0.5">PLAY <ChevronRight size={12} className="text-slate-500" /></span>
        <span className="text-indigo-300">MEASURE</span>
      </div>
    </div>
  );
};
