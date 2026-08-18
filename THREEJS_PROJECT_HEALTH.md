# Three.js Project Health Certificate

## Audit scope

- Project root: `/Users/andrew/heliocide_viewer`
- Generated: `2026-08-18T19:04:27.422203+00:00`
- Source files scanned: 23
- Evidence level: static repository inspection only

## Project classification

- Architecture: **mixed**
- Renderer path: **webgl**
- Physics dependencies: @react-three/rapier

## Verdict

- Score: **88 / 100**
- Band: **healthy**
- Findings: 1
- Decisive finding: `TJS-R3F-001`

> The score is a triage aid. Static analysis does not establish runtime health.

## Verified healthy patterns

- **TJS-POS-LOOP - A frame-loop mechanism is visible**: useFrame
- **TJS-POS-TIME - Fixed-step timing signals are present**: src/App.tsx
- **TJS-POS-DEPS - Core Three.js ecosystem dependencies are pinned**: three: 0.169.0, @react-three/fiber: 8.17.10, @react-three/drei: 9.114.3, @react-three/rapier: 1.5.0
- **TJS-POS-TEST - Browser or integration test files are present**: tests/timeline.test.js

## Findings

### TJS-R3F-001 - React state setter detected inside useFrame

- Severity: **high**
- Category: `state-ownership`
- Confidence: `high`
- Evidence: src/App.tsx, src/components/Space/StarCollapseShader.tsx, src/components/Station/TacticalConsole.tsx
- Impact: Per-frame React reconciliation can cause rerenders, lifecycle instability, and frame-time spikes.
- Recommendation: Move high-frequency state to refs, physics, ECS, or transient store access and publish only low-frequency UI state to React.

## Unknown or unverified

- Static heuristics do not prove runtime behavior, memory recovery, frame rate, thermals, visual correctness, or user-path success.
- Serious findings require manual inspection of cited files before repair.

## Bounded repair queue

1. `TJS-R3F-001` - Move high-frequency state to refs, physics, ECS, or transient store access and publish only low-frequency UI state to React.

## Evidence ledger

- Generated JSON report contains the complete static inventory and finding evidence.
