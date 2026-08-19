# Iteration 42 — Replace Primitive NPC Silhouettes with Articulated Administration EVA Rigs

## What Changed
Completely replaced the simplistic placeholder capsule and cylinder NPC meshes with a detailed, fully articulated humanoid skeleton rig designed specifically for StarSilk Administration EVA suits.

### Visual Additions
1. **Articulated Humanoid Rig**:
   - Multi-bone joint hierarchy: Pelvis root, spine pitch pivot, chest carapace, neck ring gasket, helmet dome with top ridge crest, shoulder pauldrons, bicep sleeves, elbow joint rings, forearm gauntlets with wrist displays, gloved hands, hip joints, thigh armor plates, articulated knee pads, shin guards, and magnetic deck boots.
2. **Character Distinction**:
   - **Commander Vaelen (Station Director)**: O-6 Command, Deep Navy/Gold suit, height 1.82m.
   - **Specialist Corin (Astrophysics & Telemetry)**: T-4 Science, Slate Grey/Cyan suit, height 1.76m.
   - **Officer Selene (Sector Defense Liaison)**: S-5 Security, Dark Steel/Emerald suit, height 1.79m.
3. **Anatomical Proportions**: Humanoid proportions with realistic head-to-body ratios (7.5 heads high).

## Files Modified
- `src/components/Station/NPCs.tsx` — Rebuilt character meshes with multi-segment articulated humanoid rigs.

## Verdict
**ACCEPTED** — Huge upgrade from generic capsules to recognizable, proportioned sci-fi crew members in Administration pressure suits.
