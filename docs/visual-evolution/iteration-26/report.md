# Iteration 26: Day/Night Terminator

- **Iteration:** 26
- **Target Improvement:** Calibrate the day/night terminator on Hal'Ven IV with physical solar angular penumbra (`-0.10` to `+0.10` radians) and smooth twilight city-light activation.
- **Parent Commit:** `7aae6d4`
- **Files Changed:**
  - `src/components/Space/InhabitedPlanet.tsx`
- **Three.js Skill Applied:** `threejs-project-engineer` / `threejs-shaders-lighting-pbr`
- **Checkpoint / Camera / Time:** `A_NORMAL` / `FIRST_PERSON` / `t = 8.0s`

## What is Visibly Better
1. The day/night illumination boundary on Hal'Ven IV corresponds precisely to the 3D position vector of the central star.
2. The twilight penumbra reproduces the physical angular diameter of the solar disc, creating a smooth, photorealistic transition from bright day through amber sunset into dark night.
3. City lights activate progressively through the umbra and deep twilight penumbra, eliminating harsh steps or popping artifacts.

## Before Assessment
A coarse linear step between day and night without physical penumbra or twilight integration.

## After Assessment
Geometrically precise solar terminator with physical angular penumbra, atmospheric twilight reddening, and smooth nightside city activation.

## Performance Impact
Zero runtime regression; calculated per-fragment from the incident light vector.

## Canon Check
- Shard God naming locked.
- Physical Siege Wall strictly non-lattice.

## Verdict
**ACCEPTED**
