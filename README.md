# HELIOCIDE OBSERVATORY

A real-time, browser-native 3D interactive narrative experience set in the StarSilk continuity, built with React Three Fiber, Three.js, and TypeScript.

---

## Overview

You are an unnamed Administration observer stationed aboard **Observation Station HV-88** in high orbit above the inhabited world **Hal'Ven IV**.

The 170-year Blood Eclipse War has just reached its turning point at the Aureal Gate, where the Drakken Empire deployed programmable Starsilk as a weapon — proving for the first time that the **Shard God** could be harmed.

In immediate response, the Shard God executes a cold, surgical, disproportionate containment strike: initiating a cluster-wide heliocide to force stellar bodies into sequential gravitational collapse and establish the **Siege Wall** around Drakken space.

From the observation deck, you witness the quiet institutional normalcy of the station shatter as your central star collapses, orbital infrastructure tears free, neighboring systems extinguish across the night sky, and the station is consumed by the nascent singularity.

---

## Installation & Running Locally

### Prerequisites
- Node.js (v18+ recommended, v20+ tested)
- npm (v9+ recommended)

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Build for production and preview
npm run build
npm run preview

# 4. Run automated test suite
npm test
```

Default local development server: **http://localhost:5173**

---

## Controls

| Action | Control |
|---|---|
| **Move** | `W`, `A`, `S`, `D` or `Arrow Keys` |
| **Look (First Person)** | Click 3D Canvas to engage Pointer Lock; move mouse |
| **Unlock Cursor** | `ESC` |
| **Access Tactical Console** | `E` or Click Tactical Holotable |
| **Forensic Timeline Replay** | Accessible via bottom scrubber bar |
| **Audio Controls** | `Enable Audio` banner button or Settings modal |
| **Settings & Accessibility** | Top-right gear icon `⚙` |

---

## Key Features

1. **Deterministic Phase Architecture (Phases A through H):**
   - **Phase A — Normal (0s - 16s):** Stable star, inhabited world Hal'Ven IV, active orbital traffic, quiet crew duty routines.
   - **Phase B — Aureal Gate Alert (16s - 32s):** Flash dispatch confirming Starsilk weaponization and perimeter breach.
   - **Phase C — Shard God Authority (32s - 52s):** Sector telemetry identifies Shard God authority; diegetic tactical dossier interface unlocked with biometric identification reference.
   - **Phase D — Heliocide (52s - 78s):** Custom GLSL collapse shader drives stellar implosion, intense radiation flare, and accretion disk formation.
   - **Phase E — Cluster Cascade & Breach (78s - 104s):** Neighboring stars extinguish sequentially in angular sectors; station bulkhead fractures, venting atmosphere; zero-g floating debris.
   - **Phase F — The Siege Wall (104s - 122s):** Vast irregular swath of pure starless blackness emerges in the physical sky (strictly observing canon: NO visible lattice in physical space).
   - **Phase G — Station Loss (122s - 138s):** Station HV-88 tumbles into the gravitational vortex; concludes with monumental Administration readout: `CONTAINMENT ACHIEVED`.
   - **Phase H — Forensic Replay Mode (138s+):** Full forensic timeline scrubbing, multi-angle camera inspection, phase jumping, and restart.

2. **Diegetic Shard God Dossier:**
   - Interactive Administration holotable modal displaying the primary biometric reference sheet (`/assets/shard-god/shard_god_primary_ref.png`) with detailed tactical analysis.

3. **Procedural Web Audio Engine:**
   - 100% browser-safe, offline procedural sound synthesis using Web Audio API: multi-oscillator station drones, low-frequency gravitational collapse rumble, emergency alert sirens, and decompression noise bursts.

4. **Multi-Camera Rig:**
   - First-person interior exploration, exterior station orbit inspection, cinematic event-horizon tracking, and free forensic scrubbing camera.

5. **Accessibility & Quality Controls:**
   - Reduced-motion toggle, narrative subtitles, font scaling, audio volume sliders, and capped device pixel ratio (DPR: [1, 2]).

---

## Verification & Audits

- **Automated Tests:** `npm test` (passes 3/3 deterministic timeline & state tests)
- **TypeScript Static Check:** `npm run typecheck` (zero type errors)
- **Production Bundle:** `npm run build` (clean Vite build in ~4s)
- **Prototype Gate:** Verdict **GO** (`evaluate_prototype_gate.py`)
- **Project Health:** Score **88 / 100 — HEALTHY** (`audit_threejs_project.py`)
- **Performance & Lifecycle:** Verdict **PASS** (9,000 frames sampled, 58.9 FPS mean, p95 17.86ms, 0 slow frames)
