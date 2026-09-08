import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark, JointAngleData, CameraState } from '../types';
import { initializePoseLandmarker, generateSimulatedPoseLandmarks } from '../utils/poseService';
import { computeJointAngles, checkUserInFrame } from '../utils/poseMath';
import { PoseOverlay } from './PoseOverlay';
import { Camera, AlertCircle, RefreshCw, Eye, Sparkles } from 'lucide-react';

interface CameraViewProps {
  cameraState: CameraState;
  setCameraState: React.Dispatch<React.SetStateAction<CameraState>>;
  thresholdAngle: number;
  onPoseUpdate: (landmarks: NormalizedLandmark[] | null, angleData: JointAngleData | null) => void;
  isJumpingMode?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  cameraState,
  setCameraState,
  thresholdAngle,
  onPoseUpdate,
  isJumpingMode = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());

  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [angleData, setAngleData] = useState<JointAngleData | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 640, height: 480 });

  // Update container dimensions for responsive canvas matching
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setContainerSize({ width: clientWidth, height: clientHeight });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    let isMounted = true;
    setCameraState((prev) => ({ ...prev, isLoadingModel: true, errorMessage: null }));

    initializePoseLandmarker()
      .then((landmarker) => {
        if (!isMounted) return;
        landmarkerRef.current = landmarker;
        setCameraState((prev) => ({
          ...prev,
          isLoadingModel: false,
          modelReady: true,
        }));
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error initializing Pose Landmarker:', err);
        setCameraState((prev) => ({
          ...prev,
          isLoadingModel: false,
          modelReady: false,
          errorMessage: 'Failed to load MediaPipe Pose model. You can still test using Demo Mode.',
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [setCameraState]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    if (cameraState.demoMode) return;

    try {
      setCameraState((prev) => ({ ...prev, errorMessage: null }));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraState((prev) => ({
            ...prev,
            hasPermission: true,
            isStreaming: true,
          }));
        };
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      const isPermissionDenied =
        err instanceof Error &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');

      setCameraState((prev) => ({
        ...prev,
        hasPermission: false,
        isStreaming: false,
        errorMessage: isPermissionDenied
          ? 'Webcam permission denied. Please allow camera access or use Demo Mode to test.'
          : 'No camera found. Switching to Demo Mode so you can experience the gameplay!',
        demoMode: !isPermissionDenied, // Automatically enable demo mode if no hardware camera
      }));
    }
  }, [cameraState.demoMode, setCameraState]);

  useEffect(() => {
    if (!cameraState.demoMode) {
      startCamera();
    } else {
      // Stop webcam stream if running
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraState((prev) => ({ ...prev, isStreaming: false, errorMessage: null }));
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraState.demoMode, startCamera, setCameraState]);

  // Main Detection Loop (Video stream or Demo Simulation)
  useEffect(() => {
    let active = true;

    const processLoop = (now: number) => {
      if (!active) return;

      // Calculate FPS
      frameCountRef.current++;
      if (now - lastFpsUpdateRef.current >= 1000) {
        const fps = Math.round(
          (frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)
        );
        setCameraState((prev) => ({ ...prev, fps }));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }

      if (cameraState.demoMode) {
        // Run continuous realistic biomechanical simulation
        const simLandmarks = generateSimulatedPoseLandmarks(now, isJumpingMode);
        const angles = computeJointAngles(simLandmarks);
        setLandmarks(simLandmarks);
        setAngleData(angles);
        setCameraState((prev) => ({ ...prev, userInFrame: true }));
        onPoseUpdate(simLandmarks, angles);
      } else if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        landmarkerRef.current
      ) {
        const video = videoRef.current;
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          try {
            const results = landmarkerRef.current.detectForVideo(video, now);
            if (results.landmarks && results.landmarks.length > 0) {
              const currentLandmarks = results.landmarks[0];
              const angles = computeJointAngles(currentLandmarks);
              const inFrame = checkUserInFrame(currentLandmarks);

              setLandmarks(currentLandmarks);
              setAngleData(angles);
              setCameraState((prev) => ({ ...prev, userInFrame: inFrame }));
              onPoseUpdate(currentLandmarks, angles);
            } else {
              setLandmarks(null);
              setAngleData(null);
              setCameraState((prev) => ({ ...prev, userInFrame: false }));
              onPoseUpdate(null, null);
            }
          } catch (e) {
            console.error('Inference error in PoseLandmarker:', e);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(processLoop);

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraState.demoMode, cameraState.modelReady, isJumpingMode, onPoseUpdate, setCameraState]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] lg:h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center justify-center"
    >
      {/* Background simulated backdrop or live video */}
      {cameraState.demoMode ? (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 flex items-center justify-center">
          {/* Subtle grid lines */}
          <div
            className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]"
          />
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold backdrop-blur-sm shadow-md">
            <Sparkles size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
            <span>DEMO MODE: Simulating Real Pose Stream</span>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover -scale-x-100" // Mirror webcam for natural mirror feedback
        />
      )}

      {/* Canvas Skeleton Overlay */}
      <PoseOverlay
        landmarks={landmarks}
        angleData={angleData}
        thresholdAngle={thresholdAngle}
        width={containerSize.width}
        height={containerSize.height}
        isMirrored={!cameraState.demoMode}
      />

      {/* Real-time Movement Angle HUD */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end pointer-events-none">
        <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg text-right">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Shoulder Angle
          </div>
          <div className="flex items-baseline justify-end gap-1">
            <span
              className={`text-2xl font-black ${
                angleData && angleData.activeAngle >= thresholdAngle
                  ? 'text-emerald-400'
                  : 'text-sky-300'
              }`}
            >
              {angleData ? `${angleData.activeAngle}°` : '--°'}
            </span>
            <span className="text-xs text-slate-400">
              / target {thresholdAngle}°
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                angleData && angleData.activeAngle >= thresholdAngle
                  ? 'bg-gradient-to-r from-emerald-500 to-green-300 shadow-sm shadow-emerald-400'
                  : 'bg-gradient-to-r from-blue-500 to-sky-400'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  angleData ? (angleData.activeAngle / thresholdAngle) * 100 : 0
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* User In Frame / Posture Warning Message */}
      {!cameraState.demoMode && cameraState.isStreaming && !cameraState.userInFrame && (
        <div className="absolute bottom-4 inset-x-4 mx-auto max-w-sm z-20 px-3.5 py-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5 backdrop-blur-md shadow-xl animate-bounce">
          <Eye size={18} className="shrink-0 text-amber-400" />
          <span>Please step back so your arms and upper body are fully visible.</span>
        </div>
      )}

      {/* Error / Permission Card */}
      {!cameraState.demoMode && !cameraState.isStreaming && (
        <div className="relative z-20 max-w-md p-6 rounded-2xl bg-slate-900/90 border border-slate-700 text-center shadow-2xl backdrop-blur-md mx-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-400">
            {cameraState.errorMessage ? <AlertCircle size={24} /> : <Camera size={24} />}
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {cameraState.errorMessage ? 'Camera Unavailable' : 'Connecting Camera...'}
          </h3>
          <p className="text-xs text-slate-300 mb-4">
            {cameraState.errorMessage ||
              'AbilityPlay requires camera access to track shoulder and body movement in real time.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={startCamera}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw size={14} />
              <span>Retry Camera</span>
            </button>
            <button
              onClick={() => setCameraState((p) => ({ ...prevDemo(p), demoMode: true }))}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition"
            >
              Switch to Demo Mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function prevDemo(p: CameraState): CameraState {
  return { ...p, demoMode: true };
}
