# Iteration 43 — NPC Material, Specular Visor Reflections, and Life-Support Equipment

## What Changed
Authored high-fidelity PBR materials and attached functional EVA equipment across all three Administration crew members.

### Visual Additions
1. **Specular Reflective Visors**:
   - High-metalness (0.95), low-roughness (0.08) curved visor geometry with division-coded colors:
     - Commander Vaelen: Polished Gold (`#fbbf24`)
     - Specialist Corin: Holographic Cyan (`#38bdf8`)
     - Officer Selene: Polarized Emerald (`#34d399`)
2. **EVA Life-Support Backpacks**:
   - Recirculator core housing, twin color-accented high-pressure O2 cylinders, and dynamic status beacons that change color based on timeline phase.
3. **Chest Telemetry Matrices & Wrist Terminals**:
   - Illuminated vital displays on chest armor and left gauntlet wrist terminals with division runes.
4. **Magnetic Deck Boots**:
   - Heavy armored boots with sole lock LEDs indicating active deck adhesion.

## Files Modified
- `src/components/Station/NPCs.tsx` — Added PBR materials, specular visors, telemetry matrices, and life-support backpacks.

## Verdict
**ACCEPTED** — Dramatic visual richness and material fidelity improvement across all character models.
