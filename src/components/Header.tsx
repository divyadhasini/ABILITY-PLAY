import React from 'react';
import type { CameraState, AppMode, PersonalBaseline } from '../types';
import { Camera, Activity, Volume2, VolumeX, Sparkles, Play, Flame } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

interface HeaderProps {
  cameraState: CameraState;
  onToggleDemoMode: () => void;
  appMode: AppMode;
  onChangeAppMode: (mode: AppMode) => void;
  baseline: PersonalBaseline;
  onStartAssessment: () => void;
  onEndSession: () => void;
  isSoundMuted: boolean;
  onToggleMute: () => void;
  isSessionActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cameraState,
  onToggleDemoMode,
  appMode,
  onChangeAppMode,
  baseline,
  onStartAssessment,
  onEndSession,
  isSoundMuted,
  onToggleMute,
  isSessionActive,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
                  AbilityPlay
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  MVP Prototype
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Adaptive Rehabilitation Through Real Body Movement
              </p>
            </div>
          </div>

          {/* Mobile Sound & Demo Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title={isSoundMuted ? 'Unmute' : 'Mute'}
            >
              {isSoundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Camera Status */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
            cameraState.demoMode
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : cameraState.isStreaming
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              cameraState.demoMode
                ? 'bg-amber-400 animate-ping'
                : cameraState.isStreaming
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-rose-400'
            }`} />
            <Camera size={13} />
            <span className="font-medium">
              {cameraState.demoMode
                ? 'DEMO MODE (Simulation)'
                : cameraState.isStreaming
                ? 'Camera Connected'
                : 'Camera Disconnected'}
            </span>
          </div>

          {/* Pose Detection Status */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
            cameraState.modelReady
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Activity size={13} className={cameraState.modelReady ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
            <span>
              {cameraState.modelReady
                ? `MediaPipe Pose Active (${cameraState.fps} FPS)`
                : cameraState.isLoadingModel
                ? 'Loading AI Model...'
                : 'Pose Ready'}
            </span>
          </div>

          {/* Baseline Badge */}
          {baseline.isCalibrated && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <Flame size={13} className="text-orange-400" />
              <span>Baseline: <strong className="text-white">{baseline.maxShoulderAngle}°</strong></span>
            </div>
          )}
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-end">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              soundEffects.enabled = isSoundMuted;
              onToggleMute();
            }}
            className="hidden md:flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
            title={isSoundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isSoundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Demo Mode Switch */}
          <button
            onClick={onToggleDemoMode}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
              cameraState.demoMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
            }`}
            title="Toggle simulated biomechanics for testing without webcam"
          >
            <span>{cameraState.demoMode ? '● DEMO MODE ON' : 'Test Demo Mode'}</span>
          </button>

          {/* Game Mode Switcher */}
          <button
            onClick={() => onChangeAppMode(appMode === 'basketball' ? 'jump' : 'basketball')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1.5"
          >
            {appMode === 'basketball' ? 'Try Jump Mode 🏃' : 'Adaptive Basketball 🏀'}
          </button>

          {/* Start Assessment CTA */}
          <button
            onClick={onStartAssessment}
            className="px-4 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30 border border-blue-400/40 transition flex items-center gap-1.5 hover:scale-105 active:scale-95"
          >
            <Play size={15} className="fill-white" />
            <span>{baseline.isCalibrated ? 'Re-Calibrate' : 'Start Assessment'}</span>
          </button>

          {/* Finish Session CTA */}
          {isSessionActive && (
            <button
              onClick={onEndSession}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition"
            >
              Finish Session
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
