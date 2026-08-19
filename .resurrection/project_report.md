# Project Resurrection Report: heliocide_viewer

## Identity
- Name: heliocide_viewer
- Path: /Users/andrew/heliocide_viewer
- Project type: vite_app
- Confidence: 0.75
- Inferred purpose: Purpose could not be inferred confidently from filesystem signals.
- Evidence:
  - Found package.json
  - Found vite.config.ts
  - Found index.html

## Git State
- Summary: Repo root: /Users/andrew/heliocide_viewer | Branch: main | Status: dirty | Remote: git@github.com:westkitty/Heliocide_Viewer.git
- Latest commit: a5574ea69e50a446c2895df34ac8d52b2d6142a8 fix(product): execution pass for interaction, visual canon, and ui footprint
- Tracked modified count: 3
- Untracked count: 0
- Staged count: 1

## Commands Detected
- [build] npm run build (package.json:scripts.build)
- [run/dev] npm run dev (package.json:scripts.dev)
- [run/dev] npm run preview (package.json:scripts.preview)
- [test] npm run test (package.json:scripts.test)
- [unknown] npm run typecheck (package.json:scripts.typecheck)
- [run/dev] npm run dev (vite.config.*)
- [build] npm run build (vite.config.*)

## Fragile Files
- package-lock.json
- package.json
- README.md
- vite.config.ts

## Duplicate Or Stale Candidates
- None detected.

## Secret-Risk Findings
No secret-risk matches detected.

## Recommended Next Actions
1. Inspect the current uncommitted Git changes before making new edits.
2. Back up or review fragile configuration files before any risky changes.
3. Validate the project with the hinted test command: npm run test
4. Validate the project with the hinted run/dev command: npm run dev
5. Validate the project with the hinted build command: npm run build

## Scan Metadata
- Timestamp: 2026-08-19T05:13:02+00:00
- Scanner version: 1.1.0
