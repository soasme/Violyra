# Usage

## Canonical Workflow Files

Violyra should feel like a Markdown-first workflow, not a pile of user-facing JSON.

Unless stated otherwise, paths below are relative to `<project-dir>`.

Use these three files as the canonical collaboration surface:

- `docs/idea.md` — approved concept, constraints, seeds, and chapter shape
- `docs/plan.md` — approved task plan with exact paths, checks, blockers, and next steps
- `docs/exec.md` — live execution log with outputs, blockers, approvals, and review findings

These three files are enough for the workflow layer. Lower-level JSON still exists where scripts need deterministic input or validation, such as `project.json`, `shot-list.json`, and `consistency-report.json`.

## Project Layout

```
<project-dir>/
├── docs/
│   ├── idea.md
│   ├── plan.md
│   └── exec.md
├── assets/
│   ├── images/
│   ├── videos/
│   ├── audios/
│   └── fonts/
├── global/
├── characters/
└── chapters/
```

## Happy Path

1. Run `brainstorming-video-idea` to converge on the concept and write `<project-dir>/docs/idea.md`.
2. Run `setup-video-project` to scaffold the project, create `project.json`, create `<project-dir>/docs/plan.md` / `<project-dir>/docs/exec.md`, and prepare `<project-dir>/assets/`.
3. Run `writing-video-plan` to turn the approved idea into an actionable `<project-dir>/docs/plan.md`.
4. Run `executing-video-plan` to execute tasks from `<project-dir>/docs/plan.md` and keep `<project-dir>/docs/exec.md` current.
5. Run lower-level pipeline skills as needed. They may write JSON reports or packs, but those are implementation artifacts, not the primary user workflow.
6. Run `retention-driven-development` and `requesting-video-review` before delivery, and record review results in `<project-dir>/docs/exec.md`.

## When JSON Is Still Expected

Some scripts still require machine-readable files:

- `project.json` — project config and shared asset dirs
- `assets/videos/storyboard.json` — compile-time scene manifest when `compiling-video` is used
- `shot-list.json`, `shot-details.json`, `extraction-report.json`, `consistency-report.json` — validated pipeline outputs

Rule of thumb: think and collaborate in Markdown first, then export JSON only when a script genuinely needs it.
