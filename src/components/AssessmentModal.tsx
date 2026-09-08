import React, { useState, useEffect, useRef } from 'react';
import { soundEffects } from '../utils/soundEffects';
import { calculateBaseline, saveBaselineToStorage } from '../utils/baseline';
import type { PersonalBaseline, JointAngleData } from '../types';
import { Sparkles, CheckCircle2, Flame, ArrowRight, X, Play, Sliders } from 'lucide-react';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAngleData: JointAngleData | null;
  onBaselineCalibrated: (baseline: PersonalBaseline) => void;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  isOpen,
  onClose,
  currentAngleData,
  onBaselineCalibrated,
}) => {
  const [phase, setPhase] = useState<'intro' | 'calibrating' | 'completed'>('intro');
  const [secondsRemaining, setSecondsRemaining] = useState(6);
  const [maxObservedAngle, setMaxObservedAngle] = useState(0);
  const [finalCalibratedAngle, setFinalCalibratedAngle] = useState(118);

  const samplesRef = useRef<number[]>([]);
  const maxObservedAngleRef = useRef<number>(0);
  const onBaselineCalibratedRef = useRef(onBaselineCalibrated);
  onBaselineCalibratedRef.current = onBaselineCalibrated;

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('intro');
      setSecondsRemaining(6);
      setMaxObservedAngle(0);
      maxObservedAngleRef.current = 0;
      samplesRef.current = [];
    }
  }, [isOpen]);

  // Start Calibration
  const startCalibration = () => {
    setPhase('calibrating');
    setSecondsRemaining(6);
    setMaxObservedAngle(0);
    maxObservedAngleRef.current = 0;
    samplesRef.current = [];
    soundEffects.playCountdownBeep(true);
  };

  // Continuous sample recording during calibration phase
  useEffect(() => {
    if (phase === 'calibrating' && currentAngleData) {
      const angle = currentAngleData.activeAngle;
      if (angle > 10) {
        samplesRef.current.push(angle);
        if (angle > maxObservedAngleRef.current) {
          maxObservedAngleRef.current = angle;
          setMaxObservedAngle(angle);
        }
      }
    }
  }, [phase, currentAngleData]);

  // Stable Countdown Timer that will not reset on state/angle updates
  useEffect(() => {
    if (phase !== 'calibrating') return;

    const intervalId = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);

          // Calculate final baseline
          const samples = samplesRef.current;
          const peakFromSamples = maxObservedAngleRef.current;
          const calculatedPeak =
            samples.length > 0
              ? calculateBaseline(samples)
              : peakFromSamples > 30
              ? peakFromSamples
              : 118;

          setFinalCalibratedAngle(calculatedPeak);

          const newBaseline: PersonalBaseline = {
            maxShoulderAngle: calculatedPeak,
            calibratedAt: Date.now(),
            samples: [...samples],
            isCalibrated: true,
          };

          saveBaselineToStorage(newBaseline);
          onBaselineCalibratedRef.current(newBaseline);
          soundEffects.playFanfare();
          setPhase('completed');
          return 0;
        } else {
          soundEffects.playCountdownBeep(false);
          return prev - 1;
        }
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [phase]);

  // Quick Calibration preset helper
  const applyPresetBaseline = (angle: number) => {
    setFinalCalibratedAngle(angle);
    const newBaseline: PersonalBaseline = {
      maxShoulderAngle: angle,
      calibratedAt: Date.now(),
      samples: [angle],
      isCalibrated: true,
    };
    saveBaselineToStorage(newBaseline);
    onBaselineCalibratedRef.current(newBaseline);
    soundEffects.playFanfare();
    setPhase('completed');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 text-white overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X size={18} />
        </button>

        {/* Phase 1: Intro */}
        {phase === 'intro' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-black mb-2">Personal Baseline Assessment</h2>
            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
              We never compare children against arbitrary universal standards.
              In this 6-second assessment, gently move your arm comfortably so AbilityPlay can adapt
              hoop height, target size, and throw timing specifically to you.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 mb-5 text-left flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="text-xs text-slate-300">
                <strong className="text-white block mb-0.5">Instructions:</strong>
                Press <strong>Start Assessment</strong> and raise your arm to your natural, comfortable reach.
              </div>
            </div>

            {/* Quick Calibration Presets */}
            <div className="mb-5 text-left">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders size={13} className="text-amber-400" />
                <span>Or Select Quick Range of Motion Preset</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <button
                  onClick={() => applyPresetBaseline(68)}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs transition hover:border-amber-400/50"
                >
                  <div className="font-bold text-amber-300">Level 1: 68°</div>
                  <div className="text-[10px] text-slate-400">Gentle Reach</div>
                </button>
                <button
                  onClick={() => applyPresetBaseline(118)}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs transition hover:border-sky-400/50"
                >
                  <div className="font-bold text-sky-300">Level 2: 118°</div>
                  <div className="text-[10px] text-slate-400">Standard Reach</div>
                </button>
                <button
                  onClick={() => applyPresetBaseline(152)}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs transition hover:border-emerald-400/50"
                >
                  <div className="font-bold text-emerald-300">Level 3: 152°</div>
                  <div className="text-[10px] text-slate-400">High Overhead</div>
                </button>
              </div>
            </div>

            <button
              onClick={startCalibration}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-blue-500/30 transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Play size={18} className="fill-white" />
              <span>Start Live 6-Second Assessment</span>
            </button>
          </div>
        )}

        {/* Phase 2: Calibrating */}
        {phase === 'calibrating' && (
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3 animate-pulse">
              ● Recording Real-time Biomechanics
            </div>

            <h2 className="text-2xl font-black mb-1">Gently Raise Your Arm</h2>
            <p className="text-xs text-slate-400 mb-6">
              Move to your highest comfortable reach position
            </p>

            {/* Big Countdown Badge with Pulse Ring */}
            <div className="w-28 h-28 rounded-full border-4 border-cyan-400 bg-slate-800/90 flex flex-col items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/30 relative animate-pulse-fast">
              <span className="text-4xl font-black text-cyan-300">{secondsRemaining}s</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Remaining</span>
            </div>

            {/* Real-time Angle Feedback Gauge */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 mb-4">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-slate-400">Current Live Angle:</span>
                <span className="font-bold text-sky-300 text-sm">
                  {currentAngleData ? `${currentAngleData.activeAngle}°` : '--°'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Peak Observed Reach:</span>
                <span className="font-black text-emerald-400 text-base">
                  {maxObservedAngle > 0 ? `${maxObservedAngle}°` : '--°'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Completed */}
        {phase === 'completed' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black mb-1">Baseline Calibrated!</h2>
            <p className="text-xs text-slate-300 mb-5">
              Your personalized movement profile is set.
            </p>

            {/* Baseline Stat Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-950/60 border border-indigo-500/40 shadow-xl mb-6">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4 text-orange-400" />
                Personal Baseline Range of Motion
              </div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-yellow-300 my-1">
                {finalCalibratedAngle}°
              </div>
              <p className="text-[11px] text-slate-400">
                Hoop height, target size, and threshold are now calibrated for you.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/30 transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Play Adaptive Basketball</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
