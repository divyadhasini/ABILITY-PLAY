import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  NormalizedLandmark,
  JointAngleData,
  PersonalBaseline,
  AppMode,
  SessionStats,
  CameraState,
} from './types';
import { createInitialBaseline, loadBaselineFromStorage } from './utils/baseline';
import { getGameParameters } from './utils/adaptiveEngine';
import { MovementDetector } from './utils/movementDetector';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { BasketballGame } from './components/BasketballGame';
import { JumpGame } from './components/JumpGame';
import { MetricsPanel } from './components/MetricsPanel';
import { AssessmentModal } from './components/AssessmentModal';
import { ResultsCard } from './components/ResultsCard';

export const App: React.FC = () => {
  // 1. Camera & AI State
  const [cameraState, setCameraState] = useState<CameraState>({
    hasPermission: false,
    isStreaming: false,
    isLoadingModel: true,
    modelReady: false,
    errorMessage: null,
    userInFrame: false,
    fps: 0,
    demoMode: false,
  });

  // 2. Personal Baseline State
  const [baseline, setBaseline] = useState<PersonalBaseline>(() => {
    return loadBaselineFromStorage() || createInitialBaseline();
  });

  // 3. Application & Game Modes
  const [appMode, setAppMode] = useState<AppMode>('basketball');
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // 4. Real-time Biomechanics Feed
  const [currentAngleData, setCurrentAngleData] = useState<JointAngleData | null>(null);
  const [isBasketballTriggered, setIsBasketballTriggered] = useState(false);
  const [isJumpTriggered, setIsJumpTriggered] = useState(false);
  const [jumpIntensity, setJumpIntensity] = useState(0);
  const [jumpScore, setJumpScore] = useState(0);

  // 5. Session Analytics
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalRepetitions: 0,
    successfulActions: 0,
    score: 0,
    bestMovementAngle: 0,
    currentStreak: 0,
    bestStreak: 0,
    baselineAngle: baseline.maxShoulderAngle,
    challengeLevel: 1,
    repetitionHistory: [],
  });

  // Movement Detector instance
  const detectorRef = useRef<MovementDetector>(new MovementDetector());

  // Calculate adaptive game parameters from personal baseline
  const gameParams = getGameParameters(baseline.maxShoulderAngle);

  // Update session challenge level when baseline updates
  useEffect(() => {
    setSessionStats((prev) => ({
      ...prev,
      baselineAngle: baseline.maxShoulderAngle,
      challengeLevel: gameParams.challengeLevel,
    }));
  }, [baseline, gameParams.challengeLevel]);

  // Reset movement detector state when switching between basketball and jump games
  useEffect(() => {
    detectorRef.current.reset();
    setIsBasketballTriggered(false);
    setIsJumpTriggered(false);
  }, [appMode]);

  // Handle live pose updates from MediaPipe Camera stream
  const handlePoseUpdate = useCallback(
    (landmarks: NormalizedLandmark[] | null, angleData: JointAngleData | null) => {
      setCurrentAngleData(angleData);

      if (!landmarks) return;

      if (appMode === 'basketball') {
        const detection = detectorRef.current.evaluateArmRaise(
          landmarks,
          gameParams.successThresholdAngle
        );

        if (detection.triggered) {
          setIsBasketballTriggered(true);
          // Auto-reset trigger pulse
          setTimeout(() => setIsBasketballTriggered(false), 200);
        }

        // Track best movement observed in current session
        if (angleData && angleData.activeAngle > sessionStats.bestMovementAngle) {
          setSessionStats((prev) => ({
            ...prev,
            bestMovementAngle: angleData.activeAngle,
          }));
        }
      } else if (appMode === 'jump') {
        const jumpDetection = detectorRef.current.evaluateJump(landmarks);
        setJumpIntensity(jumpDetection.intensity);

        if (jumpDetection.triggered) {
          setIsJumpTriggered(true);
          setTimeout(() => setIsJumpTriggered(false), 200);
        }
      }
    },
    [appMode, gameParams.successThresholdAngle, sessionStats.bestMovementAngle]
  );

  // On successful basketball shot
  const handleSuccessfulShot = (angle: number) => {
    setSessionStats((prev) => {
      const newStreak = prev.currentStreak + 1;
      const newTotal = prev.totalRepetitions + 1;
      const newSuccess = prev.successfulActions + 1;
      const newScore = prev.score + 1;

      return {
        ...prev,
        score: newScore,
        totalRepetitions: newTotal,
        successfulActions: newSuccess,
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        bestMovementAngle: Math.max(prev.bestMovementAngle, angle),
        repetitionHistory: [
          ...prev.repetitionHistory,
          {
            id: String(Date.now()),
            timestamp: Date.now(),
            angle,
            success: true,
            type: 'shot',
          },
        ],
      };
    });
  };

  // On successful jump in jump mode
  const handleSuccessfulJump = () => {
    setJumpScore((prev) => prev + 10);
    setSessionStats((prev) => ({
      ...prev,
      totalRepetitions: prev.totalRepetitions + 1,
      successfulActions: prev.successfulActions + 1,
      repetitionHistory: [
        ...prev.repetitionHistory,
        {
          id: String(Date.now()),
          timestamp: Date.now(),
          angle: 0,
          success: true,
          type: 'jump',
        },
      ],
    }));
  };

  // Handle Assessment Completion
  const handleBaselineCalibrated = (newBaseline: PersonalBaseline) => {
    setBaseline(newBaseline);
  };

  // Reset / Play Again
  const handlePlayAgain = () => {
    setIsResultsOpen(false);
    detectorRef.current.reset();
    setSessionStats({
      totalRepetitions: 0,
      successfulActions: 0,
      score: 0,
      bestMovementAngle: 0,
      currentStreak: 0,
      bestStreak: 0,
      baselineAngle: baseline.maxShoulderAngle,
      challengeLevel: gameParams.challengeLevel,
      repetitionHistory: [],
    });
    setJumpScore(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. TOP HEADER & NAVIGATION */}
      <Header
        cameraState={cameraState}
        onToggleDemoMode={() =>
          setCameraState((prev) => ({ ...prev, demoMode: !prev.demoMode }))
        }
        appMode={appMode}
        onChangeAppMode={setAppMode}
        baseline={baseline}
        onStartAssessment={() => setIsAssessmentOpen(true)}
        onEndSession={() => setIsResultsOpen(true)}
        isSoundMuted={isSoundMuted}
        onToggleMute={() => setIsSoundMuted(!isSoundMuted)}
        isSessionActive={sessionStats.totalRepetitions > 0 || jumpScore > 0}
      />

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Intro Tagline & Quick Action Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-4 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Adaptive Rehabilitation Playground</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
                Live AI Vision
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Turning physical therapy movements into sports experiences children love to play.
            </p>
          </div>

          {!baseline.isCalibrated && (
            <button
              onClick={() => setIsAssessmentOpen(true)}
              className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <span>Set Personal Baseline</span>
            </button>
          )}
        </div>

        {/* 3. CORE INTERACTIVE 2-COLUMN VIEWPORT (LEFT: AI CAMERA, RIGHT: GAME PANEL) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* LEFT: Live Webcam with Real-time MediaPipe Skeleton & Angle Visualization */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Real-time Body Tracking
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full">
                  MediaPipe Pose
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {appMode === 'jump'
                  ? 'Tracking knee (Hip → Knee → Ankle) & jump vectors'
                  : 'Tracking shoulder, elbow & wrist vectors'}
              </span>
            </div>

            <CameraView
              cameraState={cameraState}
              setCameraState={setCameraState}
              thresholdAngle={gameParams.successThresholdAngle}
              onPoseUpdate={handlePoseUpdate}
              appMode={appMode}
            />
          </div>

          {/* RIGHT: Adaptive Basketball Game or Jump Mode Experience */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {appMode === 'basketball' ? 'Adaptive Basketball Game' : 'Mini-Demo: Jump Mode'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full">
                  {gameParams.levelLabel.split(':')[0]}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {appMode === 'basketball' ? 'Raise arm to shoot' : 'Jump up to catch star'}
              </span>
            </div>

            {appMode === 'basketball' ? (
              <BasketballGame
                gameParams={gameParams}
                sessionStats={sessionStats}
                currentAngle={currentAngleData ? currentAngleData.activeAngle : 0}
                isTriggered={isBasketballTriggered}
                onSuccessfulShot={handleSuccessfulShot}
                personalBaseline={baseline.maxShoulderAngle}
              />
            ) : (
              <JumpGame
                isJumpTriggered={isJumpTriggered}
                jumpIntensity={jumpIntensity}
                onSuccessfulJump={handleSuccessfulJump}
                jumpScore={jumpScore}
              />
            )}
          </div>
        </div>

        {/* 4. REAL-TIME TELEMETRY & ADAPTIVE METRICS PANEL */}
        <MetricsPanel
          gameParams={gameParams}
          sessionStats={sessionStats}
          angleData={currentAngleData}
          personalBaseline={baseline.maxShoulderAngle}
          appMode={appMode}
        />
      </main>

      {/* 5. FOOTER */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-400">
        <p>
          AbilityPlay • Turning rehabilitation movements into sports experiences children want to play.
        </p>
      </footer>

      {/* 6. MODALS */}
      {/* Assessment Calibration Modal */}
      <AssessmentModal
        isOpen={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
        currentAngleData={currentAngleData}
        onBaselineCalibrated={handleBaselineCalibrated}
      />

      {/* Results Celebration Modal */}
      <ResultsCard
        isOpen={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
        sessionStats={sessionStats}
        personalBaseline={baseline.maxShoulderAngle}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  );
};
export default App;
