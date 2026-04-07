# Usage

Violyra is a skill library for AI agents doing video production work. It is not a single rigid pipeline, but it should still feel Markdown-first and project-local rather than repo-global or JSON-heavy.

Unless stated otherwise, paths below are relative to `<project-dir>`.

## Canonical Workflow Files

Use these three files as the main collaboration surface:

- `docs/idea.md` — approved concept, constraints, source assets, and setup seeds
- `docs/plan.md` — approved task plan with exact paths, checks, blockers, and next steps
- `docs/exec.md` — live execution log with outputs, blockers, approvals, and review findings

These three files are enough for the workflow layer. Lower-level JSON still exists where scripts need deterministic input or validation, such as `project.json`, `shot-list.json`, and `consistency-report.json`.

## Project Layout

```text
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
├── logs/
├── global/
├── characters/
└── chapters/
```

Put project-specific inputs under `assets/`. Examples:

- lyrics
- song audio
- screenplay or story brief
- voiceover audio
- reference stills
- source footage
- downloaded media

## Basic Flow

Many projects follow this shape:

1. Run `brainstorming-video-idea` to converge on the concept and write `<project-dir>/docs/idea.md`.
2. Run `setup-video-project` to scaffold the workspace, create `project.json`, create `<project-dir>/docs/plan.md` / `<project-dir>/docs/exec.md`, and prepare `<project-dir>/assets/`.
3. Place or generate the required project inputs under `<project-dir>/assets/`.
4. Run `writing-video-plan` to turn the approved idea into an actionable `<project-dir>/docs/plan.md`.
5. Run `executing-video-plan` to execute tasks from `<project-dir>/docs/plan.md` and keep `<project-dir>/docs/exec.md` current.
6. Run `retention-driven-development` and `requesting-video-review` before delivery, and record review results in `<project-dir>/docs/exec.md`.

## Choosing The Right Workflow

### Idea-first workflow

Use this when you are starting from a rough prompt, song concept, screenplay idea, or visual direction.

Typical sequence:

1. `brainstorming-video-idea`
2. `setup-video-project`
3. `writing-video-plan`
4. `executing-video-plan`
5. `retention-driven-development`
6. `requesting-video-review`

### Full-pipeline workflow

Use this when the project cleanly matches one of Violyra's end-to-end pipeline patterns.

- `mv-production-pipeline` for music-video style productions
- `shorts-production-pipeline` for short-form narrative productions

### Direct skill workflow

Use this when you already know which step you need.

Examples:

- already have lyrics and want timing: `aligning-lyrics`
- already have a shot list and want packs/details: `running-video-production-pipeline`
- already have prompts and want generation: `using-replicate-model` or `using-falai-model`
- already have scenes and want final assembly: `compiling-video`

## Source Assets Rule

The right rule is:

1. Put project inputs under `<project-dir>/assets/`
2. Make the required inputs explicit in `<project-dir>/docs/idea.md`
3. Let `writing-video-plan` derive the execution requirements from that project context

Do not assume every project uses the same files.

## When JSON Is Still Expected

Some scripts still require machine-readable files:

- `project.json` — project config and shared asset dirs
- `assets/videos/storyboard.json` — compile-time scene manifest when `compiling-video` is used
- `shot-list.json`, `shot-details.json`, `extraction-report.json`, `consistency-report.json` — validated pipeline outputs

Rule of thumb: think and collaborate in Markdown first, then export JSON only when a script genuinely needs it.
