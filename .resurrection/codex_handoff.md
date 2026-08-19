# Codex Handoff: heliocide_viewer

Read this handoff and project_report.md first.

## Project Identity
- Name: heliocide_viewer
- Path: /Users/andrew/heliocide_viewer
- Purpose: Purpose could not be inferred confidently from filesystem signals.

## Current Git State
- Repo root: /Users/andrew/heliocide_viewer | Branch: main | Status: dirty | Remote: git@github.com:westkitty/Heliocide_Viewer.git
- Latest commit: a5574ea69e50a446c2895df34ac8d52b2d6142a8 fix(product): execution pass for interaction, visual canon, and ui footprint

## Detected Project Type
- Type: vite_app
- Confidence: 0.75
- Evidence:
  - Found package.json
  - Found vite.config.ts
  - Found index.html

## Likely Commands
- [build] npm run build
- [run/dev] npm run dev
- [run/dev] npm run preview
- [test] npm run test
- [unknown] npm run typecheck
- [run/dev] npm run dev
- [build] npm run build

## Fragile Files
- package-lock.json
- package.json
- README.md
- vite.config.ts

## Duplicate Or Stale Candidates
- None detected.

## Secret-Risk Warning Summary
No secret-risk matches detected.

## Top 5 Recommended Next Actions
1. Inspect the current uncommitted Git changes before making new edits.
2. Back up or review fragile configuration files before any risky changes.
3. Validate the project with the hinted test command: npm run test
4. Validate the project with the hinted run/dev command: npm run dev
5. Validate the project with the hinted build command: npm run build

## Strict Codex Instruction Block

Read this handoff and project_report.md first.
Make one bounded change only.
Do not rewrite the project.
Do not delete or reorganize files.
Inspect existing files before editing.
Run the smallest relevant validation command available.
If validation cannot be run, explain why.
Report changed files, commands run, test results, and remaining risks.
