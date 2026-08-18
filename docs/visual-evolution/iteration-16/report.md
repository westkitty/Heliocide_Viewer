# Iteration 16: Relativistic Brightness Asymmetry

- **Iteration:** 16
- **Target Improvement:** Apply relativistic Doppler beaming (`I_obs = I_emit * delta^3.8`) and chromatic Doppler shift to the accretion disk around the collapsed black hole.
- **Parent Commit:** `66bda9c`
- **Files Changed:**
  - `src/components/Space/StarCollapseShader.tsx`
- **Three.js Skill Applied:** `threejs-project-engineer` / `threejs-shaders-lighting-pbr`
- **Checkpoint / Camera / Time:** `D_COLLAPSE` / `FIRST_PERSON` / `t = 65.0s`

## What is Visibly Better
1. The accretion disc around the singularity displays prominent relativistic brightness asymmetry: the side rotating toward the observer is boosted by relativistic beaming into brilliant incandescent cyan-white.
2. The receding side is redshifted and dimmed, capturing true Einsteinian relativistic physics (similar to Event Horizon Telescope and General Relativistic ray-tracing).
3. Transforms the black hole from an arcade graphic into a serious astrophysical simulation.

## Before Assessment
Symmetrical uniform brightness across the entire circumference of the accretion disc.

## After Assessment
Authentic relativistic Doppler beaming with powerful brightness asymmetry and chromatic shifting between approaching and receding limbs.

## Performance Impact
Zero runtime overhead; analytical Doppler formula computed per-fragment.

## Canon Check
- Shard God naming locked.
- Physical Siege Wall strictly non-lattice.

## Verdict
**ACCEPTED**
