# Iteration 44 — NPC Kinematic Locomotion, Evacuation Running, and Contextual Stances

## What Changed
Implemented procedural kinematic animation state machines for all three crew members driven by the deterministic timeline.

### Visual Additions
1. **Kinematic Locomotion Cycles**:
   - Dynamic walk/run cycles triggered when moving between waypoints.
   - Legs swing with sinusoidal forward/backward motion; knees flex naturally on backswing; arms swing in counter-phase to legs.
   - Spine lean: Running crew members pitch forward aggressively (0.2 rad) toward the evacuation corridor.
2. **Contextual Idle & Work Postures**:
   - **Commander Vaelen**: Authoritative stance with arms clasped behind back and head tracking the solar disk during nominal observation.
   - **Specialist Corin**: Raised right arm typing on holographic wrist computer and terminal, head glancing between screens.
   - **Officer Selene**: Defensive observation posture scanning between the orbital garrison view and console.
3. **Alert & Panic Reactions**:
   - Expressive hand gestures, urgent pointing, and rapid head orientation toward the holographic Shard God dossier during Phase B/C.

## Files Modified
- `src/components/Station/NPCs.tsx` — Added procedural kinematic locomotion, typing, and alert animations.

## Verdict
**ACCEPTED** — Eliminates rigid translation; characters now move and behave like living crew members in an unfolding catastrophe.
