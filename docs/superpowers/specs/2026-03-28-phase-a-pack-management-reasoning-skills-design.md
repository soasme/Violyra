---
name: Phase A — Pack Management & Reasoning Skills
description: Spec for implementing pack management (6 skills) and reasoning (4 skills + orchestrator) layers. Phase A of formalizing Violyra from POC to production-ready.
type: project
---

# Phase A: Pack Management & Reasoning Skills

**Date:** 2026-03-28
**Status:** Approved
**Scope:** Pack management skills (Wave 1) + Reasoning skills + production-pipeline orchestrator (Wave 2). Workflow skills (brainstorming-video-idea, setup-video-project, etc.) are Phase B.

## Overview

The Violyra POC has 11 working video generation skills. Phase A adds the structured data and reasoning layers that sit between a raw script/lyrics and the video generation tools:

- **Pack Management (Wave 1):** 6 skills owning JSON schema + file I/O for production assets (actors, characters, scenes, props, costumes, prompt templates). Each is a complete, independently testable unit.
- **Reasoning (Wave 2):** 4 skills that instruct agents through the breakdown → extraction → shot-detail → consistency pipeline, plus `production-pipeline` as orchestrator.

Additionally: remove the "no scripts" restriction from workflow skill definitions in the existing design doc, and fix 4 broken README skill links.

---

## Design Change: Scripts Allowed in Workflow Skills

The existing design doc (`docs/design-docs/2026-03-27-production-pipeline-design.md`) states workflow skills are "pure SKILL.md instructions — no scripts, no file I/O ownership." This restriction is removed. Scripts are allowed in any skill, including workflow skills. Workflow skills are video-production reimplementations of software engineering best practices — not redirects to superpowers skills.

---

## Architecture

```
[Pack Management Layer]          [Reasoning Layer]
generating-actor-pack            script-breakdown
generating-character-pack        entity-extraction  ──► calls pack scripts
generating-scene-pack            shot-detail
generating-prop-pack             consistency-check
generating-costume-pack
prompt-template                  production-pipeline (orchestrator)
```

Pack management skills own all JSON file I/O. Reasoning skills instruct agents on what to decide and which pack scripts to call — no LLM calls in code.

---

## Wave 1: Pack Management Skills

Six skills implemented in parallel. Each is fully independent (different entity types, different file paths).

### Skill structure (all 6)

```
skills/<skill-name>/
├── SKILL.md
└── scripts/
    ├── <entity>.js
    └── <entity>.__test__.js
```

### Skills

| Skill | Script | Extra flags |
|---|---|---|
| `generating-actor-pack` | `actor-pack.js` | `--appearance <str>` on create/update |
| `generating-character-pack` | `character-pack.js` | `--actor-id`, `--costume-id`, `--prop-ids <json-array>` |
| `generating-scene-pack` | `scene-pack.js` | standard only |
| `generating-prop-pack` | `prop-pack.js` | standard only |
| `generating-costume-pack` | `costume-pack.js` | standard only |
| `prompt-template` | `prompt-template.js` | `--category`, `--content`, `--variables <json-array>`, `--is-default` |

### Script CLI contract

```bash
pnpm exec dotenv -- node skills/<skill-name>/scripts/<entity>.js <subcommand> [options]
```

Standard subcommands (all packs):
- `create  --base-dir <path> --name <str> [--description <str>] [--tags <json-array>]`
- `read    --base-dir <path> --id <id>`
- `update  --base-dir <path> --id <id> [--name <str>] [--description <str>] [--tags <json-array>]`
- `delete  --base-dir <path> --id <id>`
- `list    --base-dir <path> [--filter <keyword>]`

Output: JSON object to stdout. Errors: `{ "error": "<message>" }` to stderr, non-zero exit.

### ID generation

All IDs: `<prefix>_<timestamp_base36>`. If two IDs generated in the same millisecond, append counter: `<prefix>_<timestamp_base36>_<n>`.

| Prefix | Entity |
|---|---|
| `actor_` | Actor |
| `char_` | Character |
| `scene_` | Scene |
| `prop_` | Prop |
| `costume_` | Costume |
| `tmpl_` | PromptTemplate |

### File paths

- Global assets: `<base-dir>/global/<entity-type>/<id>/pack.json` (actors, scenes, props, costumes)
- Templates: `<base-dir>/global/templates/<id>/template.json`
- Characters (project-scoped): `<base-dir>/characters/<id>/pack.json`

### Schema versioning

Every JSON file: `"$schemaVersion": "1.0"` at top level. Scripts validate on read; reject unknown versions.

### Test coverage (each script)

- `create`: creates file, returns correct JSON with generated ID
- `read`: returns pack JSON for existing ID
- `update`: modifies specified fields, leaves others unchanged
- `delete`: removes pack directory
- `list`: returns all packs; `--filter` filters by name keyword
- Invalid input: missing required flags → non-zero exit + error JSON
- Missing `--base-dir`: non-zero exit + error JSON
- `generating-character-pack create` with unknown `--actor-id`: non-zero exit (actor pack must exist)

---

## Wave 2: Reasoning Skills

Four skills + one orchestrator. Wave 2 runs after Wave 1 (entity-extraction calls pack scripts).

### Skill structure

```
skills/<skill-name>/
├── SKILL.md
└── scripts/
    ├── validate-<file>.js
    └── validate-<file>.__test__.js
```

`production-pipeline` has no scripts:
```
skills/production-pipeline/
├── SKILL.md
└── references/
    └── workflow.md
```

### Skills

| Skill | Validator | Input | Output |
|---|---|---|---|
| `script-breakdown` | `validate-shot-list.js` | raw text | `chapter.json`, `shot-list.json` |
| `entity-extraction` | `validate-extraction-report.js` | `shot-list.json` | pack files, `extraction-report.json` |
| `shot-detail` | `validate-shot-details.js` | `shot-list.json` + `extraction-report.json` | `shot-details.json` |
| `consistency-check` | `validate-consistency-report.js` | shot files + packs | `consistency-report.json` |

### Validator CLI contract

```bash
pnpm exec dotenv -- node skills/<skill-name>/scripts/validate-<file>.js --file <path>
```

Exits 0 on valid, 1 on invalid (error details to stderr).

### Test coverage (each validator)

- Valid fixture: exits 0
- Missing required field: exits 1 with descriptive error
- Unknown `$schemaVersion`: exits 1
- Wrong field type (e.g. string where array expected): exits 1

### SKILL.md sections (all reasoning skills)

Each must include: one-paragraph description, `## Inputs`, `## Dependencies`, `## Workflow` (numbered steps with exact script commands), `## Output`, `## Validation`, `## Error Handling`.

### `production-pipeline` orchestrator

- `SKILL.md`: instructs agent to run the 4 reasoning skills in sequence for a chapter
- `references/workflow.md`: numbered checklist — step → skill → input → output → decision point

---

## Data Flow

```
raw text
   │
   ▼
script-breakdown ──► chapter.json, shot-list.json
   │
   ▼
entity-extraction ──► pack files (global/ + characters/), extraction-report.json
   │
   ▼
shot-detail ──► shot-details.json
   │
   ▼
consistency-check ──► consistency-report.json
                           │
                           ▼
              [optional optimized shot-list.json, user-reviewed]
```

---

## Also In Scope (Phase A)

1. **Update `docs/design-docs/2026-03-27-production-pipeline-design.md`**: remove "pure SKILL.md — no scripts, no file I/O ownership" restriction from the Workflow Skills section.

2. **Fix README broken links** (4 links point to non-existent paths):

| README link text | Current (broken) path | Correct path |
|---|---|---|
| Text To Speech | `skills/text-to-speech/SKILL.md` | `skills/generate-voiceover/SKILL.md` |
| Video Upscale | `skills/video-upscale/SKILL.md` | `skills/upscale-video/SKILL.md` |
| Transparent Image | `skills/transparent-image/SKILL.md` | `skills/extract-foreground/SKILL.md` |
| YouTube Thumbnail Generator | `skills/youtube-thumbnail-generator/SKILL.md` | `skills/generate-thumbnail/SKILL.md` |

---

## Implementation Approach

**Wave 1** — 6 parallel subagents, one per pack skill. No inter-agent dependencies.

**Wave 2** — 4 parallel subagents (reasoning validators) after Wave 1 completes. Then 1 agent for `production-pipeline`.

**Misc fixes** — design doc update + README link fixes can run in parallel with Wave 1.

Each subagent is responsible for its skill end-to-end: SKILL.md, script, tests, and verifying `pnpm test` passes for its files.

---

## Out of Scope (Phase B)

Workflow skills: `brainstorming-video-idea`, `setup-video-project`, `writing-plans`, `executing-video-plan`, `retention-driven-development`, `requesting-video-review`.

Full pipeline skills: `mv-production-pipeline`, `shorts-production-pipeline`.
