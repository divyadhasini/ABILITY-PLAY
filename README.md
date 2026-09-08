# 🏀 AbilityPlay

> **“Turning rehabilitation movements into sports experiences children want to play.”**

AbilityPlay is an AI-powered computer-vision rehabilitation game prototype. It tracks a child's real physical body movements using **MediaPipe Pose Landmarker**, establishes their **Personal Baseline Range of Motion (ROM)**, and adaptively configures game mechanics so that physical therapy exercises feel like an empowering, personalized video game.

---

## 🌟 Core MVP Innovation

> **A CHILD'S REAL BODY MOVEMENT CONTROLS THE GAME.**

```
WEBCAM VIDEO
    ↓
MEDIAPIPE POSE LANDMARKER
    ↓
33 3D/2D SKELETON JOINTS (Shoulder, Elbow, Wrist, Torso, Legs)
    ↓
VECTOR ANGLE MATHEMATICS (Live Shoulder Elevation / Range of Motion)
    ↓
PERSONAL BASELINE CALIBRATION (5-10s Assessment)
    ↓
ADAPTIVE GAME ENGINE (Hoop Height, Target Size, Shot Timing, Trigger Threshold)
    ↓
PHYSICAL MOVEMENT → INTENT CONFIRMATION → REAL-TIME BASKETBALL THROW
    ↓
SESSION TELEMETRY & PROGRESSIVE GAMIFICATION (Score, Streaks, % of Baseline)
```

---

## 🎯 Key Features

### 1. 📷 Real-Time Computer Vision Tracking
- Built with **`@mediapipe/tasks-vision` Pose Landmarker**.
- Runs **100% locally in the browser** at high frame rates (30–60 FPS) with zero frame uploads to external cloud APIs for strict child privacy.
- Tracks:
  - **Left / Right Shoulders**
  - **Left / Right Elbows**
  - **Left / Right Wrists**
  - **Left / Right Hips**
  - **Knees and Ankles**
- Real-time skeleton overlay with glowing active joint vectors and live angular degree HUD callouts.

### 2. 📐 Joint Angle Vector Mathematics
- Calculates joint angles (Shoulder & Knee) using vector dot-product geometry:
  $$\vec{BA} = A - B, \quad \vec{BC} = C - B$$
  $$\cos(\theta) = \frac{\vec{BA} \cdot \vec{BC}}{\|\vec{BA}\| \|\vec{BC}\|}, \quad \theta = \arccos(\text{clamp}(\cos(\theta), -1, 1)) \times \frac{180}{\pi}$$
- **Adaptive Basketball**: Computes **Shoulder Elevation / Arm Abduction** angle between Torso $\rightarrow$ Shoulder and Shoulder $\rightarrow$ Elbow/Wrist.
- **Jump Mode**: Computes **Knee Joint Angle** $\text{Angle}(\text{Hip}, \text{Knee}, \text{Ankle})$ measuring dynamic knee flexion (squat dip) and extension during jump takeoff.

### 3. ⚖️ Personal Baseline Calibration
- When clicking **"Start Assessment"**, a 6-second calibration routine tracks the child's natural, comfortable movement.
- Computes their **Personal Baseline Range of Motion (e.g. 118°)**.
- **No universal "one-size-fits-all" score**: Every child's gameplay is personalized to their own biomechanics.

### 4. 🎛️ Deterministic Adaptive Engine
The game parameters deterministically adjust based on the child's personal baseline:
- **Low Baseline (< 80° - Level 1)**: Larger target hoop (96px), lower target height (48%), forgiving shot timing (1400ms), 75% trigger threshold.
- **Moderate Baseline (80° - 115° - Level 2)**: Medium hoop (82px), standard court height (38%), balanced flight speed.
- **High Baseline (116° - 145° - Level 3)**: Precision target (70px), high hoop (28%), active stretch challenge.
- **Overhead Mastery (> 145° - Level 4)**: Compact rim (62px), high elevated backboard (20%), swift timing.

### 5. 🏀 Adaptive Basketball Rehabilitation Game
- Real physical arm raises trigger the basketball shot in real time.
- Smooth parabolic ball physics, net swish animation, celebration confetti, and synthesized Web Audio sound effects.
- Dynamic stretch progress bar shows how close the child is to releasing their next shot.

### 6. 🏃 Mini-Demo: Jump Mode (Lower-Limb Rehabilitation)
- Proves that the **same body movement engine** powers multiple sport experiences.
- Tracks **Knee Flexion/Extension Angles** $\text{Angle}(\text{Hip}, \text{Knee}, \text{Ankle})$ alongside vertical hip & shoulder momentum to detect physical jumps and bounce the on-screen runner.

### 7. 📊 Session Performance Analytics
- Displays at the end of each rehabilitation session:
  - Total Repetitions & Successful Actions
  - Success Rate %
  - Personal Starting Baseline vs. Best Movement Reached
  - Motivational Progress Statement: *“Your movement reached 112% of your starting baseline.”*
  - Clear medical prototype disclaimer.

### 8. 🛠️ Demo Mode & Graceful Error Handling
- Includes a dedicated **Demo Mode** toggle for judges, therapists, or environments without active webcams, simulating real biomechanical motion cycles.
- Gracefully handles camera permission denials, missing hardware, model load fallbacks, and posture out-of-frame notifications.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Modern web browser (Chrome, Edge, Firefox, Safari) with WebGL/Webcam support.

### Installation

```bash
# Clone the repository
git clone https://github.com/divyadhasini/ABILITY-PLAY.git
cd ABILITY-PLAY

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Open your browser and navigate to:
**`http://localhost:5173`**

### Building for Production

```bash
npm run build
npm run preview
```

---

## 🎮 How to Test the MVP

1. **Allow Webcam Access**: Grant camera permission when prompted (or toggle **Demo Mode**).
2. **Review Skeleton Tracking**: Observe your skeleton and live shoulder angle degrees on the left panel.
3. **Calibrate Baseline**:
   - Click **"Start Assessment"**.
   - Raise your arm to a comfortable height during the 6-second countdown.
   - Observe your Personal Baseline established (e.g. `118°`).
4. **Play Adaptive Basketball**:
   - Raise your arm past the adaptive target threshold.
   - Watch the basketball launch, swish through the net, and increment your score.
5. **Try Jump Mode**:
   - Click **"Try Jump Mode"** in the top navigation.
   - Jump physically to bounce the character and collect stars.
6. **Finish Session**:
   - Click **"Finish Session"** to review the celebration modal and session analytics.

---

## 📁 Project Architecture

```
ABILITY-PLAY/
├── public/
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Navigation, status indicators, demo toggle
│   │   ├── CameraView.tsx       # Live webcam & MediaPipe inference loop
│   │   ├── PoseOverlay.tsx      # 60 FPS skeleton canvas renderer & angle badges
│   │   ├── BasketballGame.tsx   # Adaptive basketball arena, physics & hoops
│   │   ├── JumpGame.tsx         # Multi-sport jump mini-game
│   │   ├── MetricsPanel.tsx     # Telemetry grid & MOVE->PLAY pipeline
│   │   ├── AssessmentModal.tsx  # 6-second calibration & preset ROM selector
│   │   └── ResultsCard.tsx      # Session analytics & progress report
│   ├── types/
│   │   └── index.ts             # Biomechanics, baseline & game types
│   ├── utils/
│   │   ├── poseMath.ts          # Vector dot products & joint angle formulas
│   │   ├── baseline.ts          # Calibration math & localStorage persistence
│   │   ├── adaptiveEngine.ts    # Deterministic parameter calculation
│   │   ├── movementDetector.ts  # Temporal arm raise & jump classifiers
│   │   ├── poseService.ts       # MediaPipe Tasks Vision loader & simulator
│   │   └── soundEffects.ts      # Web Audio synthesized gamification SFX
│   ├── App.tsx                  # Root state coordinator
│   ├── main.tsx                 # React entrypoint
│   └── index.css                # Visual theme & glassmorphic styling
├── index.html
├── package.json
└── tsconfig.json
```

---

## 🔮 Future Product Roadmap
- 🩺 **Therapist Dashboard**: Longitudinal Range of Motion (ROM) charts, compensation detection, and prescription protocols.
- 🎮 **Multiplayer Rehabilitation**: Cooperative games for pediatric clinics and sibling play.
- 🦾 **Multi-Joint Sport Modules**: Ankle dorsiflexion soccer kicks, bilateral arm rowing, and trunk balance surfing.
- 📱 **Mobile & Tablet Apps**: iOS / Android native support with on-device CoreML / NNAPI acceleration.

---

## 📄 License
MIT License. Built for pediatric rehabilitation through play.
