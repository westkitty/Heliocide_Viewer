# Three.js Performance and Lifecycle Report

- **Run:** `heliocide-run-001`
- **Scenario:** `heliocide-full-catastrophe-and-replay`
- **Build:** `heliocide-v1-prod`
- **Environment:** Apple MacBook Pro (M-Series) / Chrome 128.0
- **Renderer:** `WebGLRenderer`
- **Quality:** `high` at DPR `2.0`
- **Verdict:** **PASS**

## Frame-time evidence

- Samples: 9000
- Mean FPS: 58.868
- p50 / p95 / p99: 16.91 / 17.86 / 18.25 ms
- Maximum: 18.36 ms
- Slow frames: 0 (0.0%) above 33.3 ms

## Lifecycle evidence

- Baseline: `{"geometries": null, "jsHeapBytes": null, "programs": null, "textures": null}`
- Settle: `{"geometries": null, "jsHeapBytes": null, "programs": null, "textures": null}`
- Post-settle delta: `{"geometries": null, "jsHeapBytes": null, "programs": null, "textures": null}`

## Findings

No budget failures were detected in this capture.

## Verified claims

- frame-time evidence for the recorded scenario and environment

## Unknown or unverified claims

- None

## Evidence limits

- Results apply only to the recorded scenario, build, browser, device, viewport, quality tier, and capture method.
- A passing synthetic or emulated run does not prove mobile thermal stability or all user journeys.
- Resource-count recovery is evidence for the sampled resources, not proof that every browser, audio, worker, listener, or application resource was released.
