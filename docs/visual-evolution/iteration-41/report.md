# Iteration 41 — Debris Mass, Varied Materials, and Mass-Dependent Tumbling & Drift

## What Changed
Overhauled `DebrisField.tsx` with a multi-class physical debris system featuring 6 distinct object categories, individualized PBR material responses, mass-dependent rotational kinetics, and decompression drift toward the breach aperture.

### Visual Additions
1. **6 Distinct Debris Types**:
   - **Hull Panels** (heavy, dark anodized titanium, slow angular inertia)
   - **Conduit Fragments** (color-coded utility line stubs: cyan coolant, green life-support, amber high-voltage)
   - **Equipment Boxes** (semi-rough composite storage containers)
   - **Insulation Batting** (lightweight golden/white thermal blankets, ultra-light mass, high drift)
   - **Glass Shards** (translucent cyan-tinted fragments with subtle emissive edge dispersion)
   - **Fasteners/Bolts** (tiny high-metalness pins, rapid multi-axis tumbling)
2. **Mass-Dependent Angular Tumbling**: Light fasteners and glass fragments tumble rapidly along three rotational axes, while heavy structural hull plates rotate slowly with heavy inertia.
3. **Decompression Drift Flow**: Debris items drift toward the breach point at `[8.8, 3.5, 2.5]` with drift velocity inversely proportional to mass.
4. **Per-Type PBR Materials**: Metallic/roughness/color properties customized per material classification.
5. **Deterministic Seeding**: Seeded random generation ensures stable, reproducible layout across sessions.

## Files Modified
- `src/components/Station/DebrisField.tsx` — Rewrote component with 6 debris classes, mass kinetics, and breach drift.

## Verdict
**ACCEPTED** — Transformed uniform gray placeholder boxes into a rich, physically differentiated zero-g debris field during atmospheric breach.
