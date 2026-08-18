# Iteration 39 — Catastrophic Hull Breach with Jagged Titanium Shards and Arcing Electrical Discharge

## What Changed
Created dedicated `HullBreach.tsx` component replacing the generic hull breach placeholder. This component implements a full physically-motivated structural failure at the observation deck's port-side viewport.

### Visual Additions
1. **Jagged Titanium Shards (5 pieces)**: Procedurally-spaced triangular hull plates with outward angular rotation simulating explosive decompression tearing. Each shard is distinct in scale, offset, and curl angle.
2. **Exposed Structural Framework**: Three visible I-beam rib stubs at the breach edge — the interior framing that was concealed behind the hull plate, now exposed and deformed.
3. **Severed Utility Conduits**: Three cut conduit bundles at the breach perimeter, color-coded to match the station's coolant (cyan), life-support (green), and power (amber) lines.
4. **Arcing Electrical Discharge**: Intermittent point lights cycling between amber and white, simulating severed wiring sparking at irregular intervals across the conduit stubs.
5. **Emergency Atmosphere Warning HUD Text**: "⚠ HULL BREACH — SECTOR 04" text element rendered at the breach site.
6. **Sealed Bulkhead (pre-breach)**: Before catastrophe phases, the breach site displays an intact sealed bulkhead panel with "SECTION C-4" serial stencil.
7. **Emergency Lighting Stabilization**: Ambient emergency illumination raised from 0.03 to 0.14 with indigo tint, ensuring interior remains continuously visible during Phase E. Strobe frequency smoothed from hard threshold to sinusoidal modulation.

### Camera Fix
- Added `camera.rotation.set(0, 0, 0)` reset when pointer is unlocked (headless capture mode) ensuring consistent screenshot orientation.

## Files Modified
- `src/components/Station/HullBreach.tsx` — **NEW** component.
- `src/components/Station/StationInterior.tsx` — Integrated HullBreach, raised emergency ambient.
- `src/components/Camera/PlayerCameraController.tsx` — Camera rotation reset for headless captures.

## Verdict
**ACCEPTED** — Major visual upgrade from placeholder breach to physically-motivated structural failure with dynamic electrical effects.
