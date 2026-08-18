# Three.js Prototype Gate

## Decision frame

- **Project:** HELIOCIDE OBSERVATORY
- **Decision question:** Can React Three Fiber + Three.js deliver the deterministic, high-impact Heliocide Observatory narrative experience with fixed-step simulation, procedural celestial collapse, physical station destruction, and forensic timeline replay?
- **Gate ID:** `gate-heliocide-001` revision 1
- **Requirements hash:** `sha256:724b940b3b316adbe21735dc151aac8eeae5e5c4f3e32bf1aa4a9380bdfa8886`
- **Targets hash:** `sha256:cab1b3c0860969ae26e574fbf1514f7c43901b462328c7015728989da7996101`
- **Prototype tier:** small
- **Architecture candidate:** react-three-fiber
- **Renderer candidate:** WebGLRenderer
- **Gate status:** ready

## Strategic browser advantages

- instant zero-install browser deployment
- declarative UI and DOM accessibility overlay
- flexible canvas/WebGL post-processing pipeline

## Representative success path

1. enter-station
2. interact-tactical-console
3. observe-npcs
4. aureal-gate-alert
5. shard-god-authority
6. heliocide-stellar-collapse
7. station-breach-cascade
8. siege-wall-starless-void
9. station-loss-containment
10. forensic-replay-scrub

## Non-goals

- galaxy-scale simulation
- multiplayer backend
- combat system
- non-canon lattice in physical sky
- procedural universe streaming

## Device and browser targets

- Desktop required: true
- Mobile required: false
- Target browsers: Chrome, Firefox, Safari
- Desktop target: 60.0 FPS, p95 <= 18.0 ms
- Mobile target: 30.0 FPS, p95 <= 36.0 ms
- Initial transfer maximum: 26214400 bytes

## Required systems

| ID | Requirement | Source |
|---|---|---|
| `controllable-primary-interaction` | Controllable primary interaction | core |
| `fixed-step-simulation` | Fixed-step simulation or justified deterministic update | core |
| `camera-behavior` | Representative camera behavior | core |
| `camera-collision` | Camera collision or explicit not-applicable evidence | core |
| `physics-or-collision` | Representative physics or collision | core |
| `animated-asset` | Representative animated asset | core |
| `representative-environment` | Representative navigable environment | core |
| `keyboard-input` | Normalized keyboard input actions | core |
| `audio-unlock-and-positional-audio` | Browser audio unlock and representative positional or game audio | core |
| `versioned-save-record` | Versioned save record | core |
| `compressed-runtime-assets` | Compressed runtime assets | core |
| `asset-manager-manifest` | Asset manager and manifest ownership | core |
| `load-unload-disposal` | Load, unload, settle, disposal, and reload | core |
| `semantic-dom-ui` | Semantic DOM HUD and pause behavior | core |
| `repeatable-performance-scenario` | Repeatable performance scenario | core |
| `browser-smoke-tests` | Target-browser smoke tests | core |
| `context-loss-restoration` | Context loss and restoration | contextLossRequired |
| `navigation-and-replanning` | Navigation, path requests, and replanning | navigationRequired |

## Alternative comparison

- Required: false
- Alternative: Not specified

## Prohibited substitutions

- A spinning model, static scene, or movement-only demo cannot replace the representative success path.
- Desktop emulation cannot replace required real mobile or tablet evidence.
- A different scenario or easier content set cannot replace a matched engine comparison.
- Visual polish cannot replace save, input, audio, lifecycle, browser, or performance evidence.
- Prototype success cannot be reported as production readiness.

## Screening warnings

- Keep high-frequency simulation outside React reconciliation and prove mount/unmount cleanup.

## Evidence record

Fill a prototype result using `assets/templates/prototype-result.template.json`, then run the evaluator.
