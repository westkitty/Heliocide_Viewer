# Three.js Capability Coverage & Knowledge Mapping

This document details the Three.js ecosystem capabilities, architectural patterns, and knowledge sources actively exercised in **HELIOCIDE OBSERVATORY**, as well as candidate technologies intentionally omitted with concrete architectural rationale.

---

## 1. Exercised Three.js Capabilities & Knowledge Lines

| # | Domain / Capability | Knowledge Line / Skill Reference | Concrete Project Integration |
|---|---|---|---|
| 1 | **Declarative Scene Graph Composition** | `pmndrs/react-three-fiber` | Scene hierarchy composed declaratively in R3F (`<Canvas>`, `<CelestialSystem>`, `<StationInterior>`, `<CameraManager>`). |
| 2 | **Staging & Spatial Helpers** | `pmndrs/drei` | `<Text>`, `<PointerLockControls>`, `<OrbitControls>` utilized for world-space typography and responsive camera transitions. |
| 3 | **Fixed-Step Simulation & Decoupled State** | `threejs-project-engineer` | Accumulator-based fixed-timestep simulation (`FIXED_TIME_STEP = 1/60`) with capped catch-up in `App.tsx`. Transient Zustand store access (`getState()`) inside `useFrame` preventing React rerender churn. |
| 4 | **Procedural Custom GLSL Shaders** | `threejs-shaders-lighting-pbr` / `mrdoob/three.js` | Custom `StarCollapseShader.tsx` implementing 3D Simplex noise plasma turbulence, dynamic relativistic limb darkening, Einstein ring accretion glow, and event horizon extinction. |
| 5 | **Deterministic Timeline Architecture** | `pmndrs/timeline` patterns | Unified timeline store (`timelineStore.ts`) governing all catastrophe phases (A through H) deterministically across both live playthrough and forensic replay scrubbing with zero divergence. |
| 6 | **Zero-G Floating Debris Simulation** | `threejs-3d-physics-games` | `DebrisField.tsx` simulating 36 floating structural objects, data slates, and canisters with zero-g kinematic drift and multi-axis tumbling upon hull rupture. |
| 7 | **Camera Transitions & Multi-Mode Navigation** | `yomotsu/camera-controls` / `pmndrs/drei` | Seamless switching between First-Person Station Navigation, Exterior Station Orbit, Cinematic Event Horizon tracking, and Forensic Replay free inspection. |
| 8 | **Deterministic Cascade Extinction** | `threejs-particle-instanced-engine` | `DistantCascadingStars.tsx` managing 3,500 background Hal'Ven cluster stars with deterministic angular sector extinction buffers. |
| 9 | **Web Audio API Procedural Sound Engine** | `web-spatial-audio-soundscapes` | Native procedural sound synthesis in `SoundSystem.ts`: multi-oscillator station drones, low-frequency gravitational collapse rumble, alert chimes, breach decompression noise bursts, and dynamic parameter modulation. |
| 10 | **Tone Mapping & Atmospheric Fog FX** | `pmndrs/postprocessing` | ACES Filmic tone mapping, dynamic exposure modulation (solar flare spike down to deep singularity extinction), and emergency red ambient fog. |
| 11 | **WebGL Context Loss & Restoration Guard** | `threejs-performance-lifecycle-auditor` | Event listeners for `webglcontextlost` and `webglcontextrestored` in `App.tsx` ensuring resilient lifecycle handling. |
| 12 | **Semantic DOM HUD & Accessibility Overlays** | `pmndrs/react-three-a11y` | Semantic DOM interface with high-contrast, subtitles, font scaling, volume controls, and reduced-motion dampening. |

---

## 2. Intentionally Omitted Technologies & Concrete Rationale

| Technology Candidate | Omission Decision | Concrete Technical Rationale |
|---|---|---|
| **WebGPU / WGSL Renderer** | *Intentionally Omitted* | WebGL2 provides guaranteed cross-browser compatibility across Chrome, Firefox, and Safari on macOS without experimental flags or unstable shader API churn. |
| **CSG Boolean Geometry Operations** | *Intentionally Omitted* | CSG operations on real-time geometries during runtime animations introduce frame-time stutter and non-manifold topology artifacts; deterministic procedural transformation of pre-authored fractured bulkhead meshes provides flawless 60 FPS performance. |
| **WebXR / VR Controllers** | *Intentionally Omitted* | Out of scope for browser-native 2D desktop display; adding VR runtime overhead would compromise the primary user journey. |
| **Heavy 3D Tiles Streaming** | *Intentionally Omitted* | Project takes place in a single compact orbital station; procedural generation and self-hosted lightweight geometry completely eliminates network streaming delays. |
| **External Audio Asset Loading** | *Intentionally Omitted* | Web Audio API procedural synthesis provides 100% offline reliability, instant startup, zero asset licensing risks, and zero network transfer overhead. |
| **External glTF Asset Hotlinking** | *Intentionally Omitted* | Prohibited by project constraints; all assets are self-hosted within the project repository. |
