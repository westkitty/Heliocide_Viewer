# Bug Sweep — Iteration 41: Debris Mass / Material / Collision Pass

## Validation Checks
1. `npm run typecheck`: Passed with 0 errors.
2. `npm test`: Passed (3/3).
3. `npm run build`: Passed (2192 modules, built in 5.83s).
4. Defect sweep:
   - Six distinct debris types render with correct per-type geometries.
   - PBR materials vary per type: hull panels dark metallic, insulation matte yellow, glass shards translucent cyan.
   - Mass-dependent tumbling: light fasteners tumble rapidly, heavy hull panels rotate slowly.
   - Decompression drift toward breach aperture: light insulation and fasteners drift fastest.
   - Deterministic seeded placement ensures consistent debris field across sessions.
   - No debris visible during nominal/collapse phases (before t=78s).
   - Shard God canonical naming: Clean.
   - Physical Siege Wall: Non-lattice verified.

## Verdict
PASSED — Ready for staging and commit.
