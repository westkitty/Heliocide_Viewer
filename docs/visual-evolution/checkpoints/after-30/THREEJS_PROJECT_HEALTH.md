# Three.js Project Health Certificate

## Audit scope

- Project root: `/Users/andrew/heliocide_viewer`
- Generated: `2026-08-18T19:55:02.097242+00:00`
- Source files scanned: 31
- Evidence level: static repository inspection only

## Project classification

- Architecture: **mixed**
- Renderer path: **webgl**
- Physics dependencies: @react-three/rapier

## Verdict

- Score: **82 / 100**
- Band: **watch**
- Findings: 2
- Decisive finding: `TJS-R3F-001`

> The score is a triage aid. Static analysis does not establish runtime health.

## Verified healthy patterns

- **TJS-POS-LOOP - A frame-loop mechanism is visible**: useFrame
- **TJS-POS-TIME - Fixed-step timing signals are present**: src/App.tsx
- **TJS-POS-DISPOSE - Explicit disposal calls are present**: .chrome-headless-profile/Default/Extensions/ghbmnnjooekpmoecnnnilnnbdlolhkhi/1.109.1_0/offscreendocument_main.js, .chrome-headless-profile/Default/Extensions/ghbmnnjooekpmoecnnnilnnbdlolhkhi/1.109.1_0/service_worker_bin_prod.js, .chrome-headless-profile/Default/Extensions/nmmhkkegccagdldgiimedpiccmgmieda/1.0.0.6_0/craw_background.js, .chrome-headless-profile/Default/Extensions/nmmhkkegccagdldgiimedpiccmgmieda/1.0.0.6_0/craw_window.js
- **TJS-POS-DEPS - Core Three.js ecosystem dependencies are pinned**: three: 0.169.0, @react-three/fiber: 8.17.10, @react-three/drei: 9.114.3, @react-three/rapier: 1.5.0
- **TJS-POS-TEST - Browser or integration test files are present**: tests/timeline.test.js

## Findings

### TJS-R3F-001 - React state setter detected inside useFrame

- Severity: **high**
- Category: `state-ownership`
- Confidence: `high`
- Evidence: src/App.tsx, src/components/PostProcessing/HeliocidePostProcessing.tsx, src/components/Space/CollapseShockwave.tsx, src/components/Space/StarCollapseShader.tsx, src/components/Station/TacticalConsole.tsx
- Impact: Per-frame React reconciliation can cause rerenders, lifecycle instability, and frame-time spikes.
- Recommendation: Move high-frequency state to refs, physics, ECS, or transient store access and publish only low-frequency UI state to React.

### TJS-LIFE-002 - Unload behavior lacks renderer resource-count evidence

- Severity: **medium**
- Category: `testing-observability`
- Confidence: `medium`
- Evidence: .chrome-headless-profile/Default/Extensions/nmmhkkegccagdldgiimedpiccmgmieda/1.0.0.6_0/craw_background.js, .chrome-headless-profile/Default/Extensions/nmmhkkegccagdldgiimedpiccmgmieda/1.0.0.6_0/craw_window.js
- Impact: Cleanup may exist in source but sustained GPU-resource growth remains untested.
- Recommendation: Add a repeated load/unload scenario and record renderer resource counts before, during, after, and after settling.

## Unknown or unverified

- Static heuristics do not prove runtime behavior, memory recovery, frame rate, thermals, visual correctness, or user-path success.
- Serious findings require manual inspection of cited files before repair.

## Bounded repair queue

1. `TJS-R3F-001` - Move high-frequency state to refs, physics, ECS, or transient store access and publish only low-frequency UI state to React.
2. `TJS-LIFE-002` - Add a repeated load/unload scenario and record renderer resource counts before, during, after, and after settling.

## Evidence ledger

- Generated JSON report contains the complete static inventory and finding evidence.
