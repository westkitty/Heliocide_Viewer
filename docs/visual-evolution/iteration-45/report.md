# Iteration 45 — NPC Zero-G Floating, Neutral Body Posture, and Inertial Drift

## What Changed
Implemented a realistic Zero-G Neutral Body Posture (NBP) kinematics model and inertial drift state for all crew members during artificial gravity loss (Phase E onwards, t >= 78.0s).

### Visual Additions
1. **Zero-G Neutral Body Posture (NBP)**:
   - When artificial gravity collapses, characters transition from standing/running to NASA-standard neutral body posture:
     - Knees flex naturally to 35°-40°
     - Arms float forward in front of chest with relaxed wrists
     - Spine assumes a gentle relaxed curve
2. **Asynchronous Limb Drift & Flailing**:
   - Legs perform gentle asynchronous drifting motions
   - Forearms make corrective stabilization motions in response to decompression airflow
   - Torso rotates with subtle multi-axis pitch/roll/yaw tumbling
3. **Emergency Gear Reaction**:
   - Magnetic deck boot LEDs flip from locked green (`#10b981`) to floating disengaged red (`#ef4444`)
   - EVA backpack warning beacons pulse emergency red

## Files Modified
- `src/components/Station/NPCs.tsx` — Added Zero-G posture and inertial limb drift kinematics.

## Verdict
**ACCEPTED** — Complete transformation of the station interior during breach: crew members now float helplessly in realistic zero-g postures as the station decompresses.
