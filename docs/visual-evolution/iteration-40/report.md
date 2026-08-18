# Iteration 40 — Decompression VFX: Atmospheric Venting, Ice Crystals, and Particulate Streams

## What Changed
Created dedicated `DecompressionVFX.tsx` component implementing a three-layer particle-based atmospheric decompression system during the hull breach phase.

### Visual Additions
1. **Atmosphere Vapor Particles (120 particles)**: Large soft blue-white fog wisps representing the station's pressurized atmosphere streaming at high velocity toward the breach aperture. Opacity decreases as decompression progresses (atmosphere depleting).
2. **Frozen Ice Crystals (60 particles)**: Sharp, small, bright white frozen moisture fragments that form as water vapor flash-freezes upon contact with vacuum. Faster velocity than vapor (lighter mass), increasing opacity during decompression as temperature drops.
3. **Entrained Micro-Dust Particulate (80 particles)**: Fine amber dust motes and loose micro-particulate entrained in the high-velocity airflow. Slowest layer, providing visual depth stratification.
4. **Directional Flow Toward Breach**: All particles stream from random interior spawn positions toward the breach point at [8.8, 3.5, 2.5] with physically-motivated directionality.
5. **Venturi Acceleration**: Particles accelerate as they approach the breach aperture, simulating the real-world Venturi effect where narrowing flow paths increase velocity.
6. **Turbulent Swirl**: Sinusoidal turbulence perturbations on particle trajectories create organic, chaotic decompression airflow rather than sterile straight-line paths.
7. **Additive Blending**: All three particle layers use additive blending with disabled depth writes for volumetric atmospheric appearance.

### Technical Details
- Pre-allocated particle pools with recycling (no garbage collection pressure).
- Deterministic seeded pseudo-random for consistent initial placement.
- Particles recycle when reaching breach proximity (< 0.8 units) or exceeding lifetime.
- Three separate `THREE.Points` objects with `THREE.PointsMaterial` for efficient GPU rendering.

## Files Modified
- `src/components/Station/DecompressionVFX.tsx` — **NEW** component.
- `src/components/Station/StationInterior.tsx` — Imported and integrated DecompressionVFX.

## Verdict
**ACCEPTED** — Major visual upgrade from static breach to dynamic atmospheric decompression with three-layer particle VFX system.
