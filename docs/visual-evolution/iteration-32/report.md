# Iteration 32: Propulsion and Mass-Respecting Ship Motion

- **Iteration:** 32
- **Target Improvement:** Implement Newtonian velocity-vector alignment, centripetal banking maneuvers, and dynamic reactive thruster plume scaling across all orbiting spacecraft.
- **Parent Commit:** `8244b8b`
- **Files Changed:**
  - `src/components/Space/OrbitalInfrastructure.tsx`
- **Three.js Skill Applied:** `threejs-project-engineer`
- **Checkpoint / Camera / Time:** `A_NORMAL` / `FIRST_PERSON` / `t = 8.0s`

## What is Visibly Better
1. Spacecraft attitude rotates smoothly to follow flight velocity vectors rather than static world orientations.
2. Orbital curves induce physical centripetal banking roll proportional to vessel mass (the heavy cruiser rolls subtly while the light shuttle banks sharply).
3. Ion exhaust plumes scale dynamically in length, color, and brightness: steady cyan plumes during nominal cruise, and elongated orange-hot afterburner torches (`#f97316`) during emergency evacuation burns.

## Before Assessment
Spacecraft translation occurred with static, rigid Euler angles and fixed-size engine points.

## After Assessment
Dynamic Newtonian attitude tracking, mass-weighted banking, and reactive thruster exhaust plumes.

## Performance Impact
Zero runtime regression; calculated per vessel per frame.

## Canon Check
- Shard God naming locked.
- Physical Siege Wall strictly non-lattice.

## Verdict
**ACCEPTED**
