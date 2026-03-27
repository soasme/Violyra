# Production Pipeline Design

**Date:** 2026-03-27
**Status:** Active

## Overview

This document describes the design for adding short-form video production capabilities to Violyra: structured asset management (actor, character, scene, prop, costume packs), reusable prompt templates, fine-grained shot control, entity extraction from raw text, cross-scene consistency checking, and full-pipeline orchestration — all as CLI-first, agent-agnostic skills with no database and no UI.

---

## Design Goals

1. **No database, no UI.** All state lives in JSON files on disk. User specifies a base directory.
2. **Agent-agnostic.** SKILL.md files contain instructions; any AI agent can follow them. No LLM calls in code.
3. **CLI-first scripts.** JS scripts handle all file I/O, schema validation, and non-LLM transforms. Flags, defaults, `--help`.
4. **Composable three-layer architecture.** Pack management (data) → reasoning (agent logic) → pipeline orchestration (workflow).
5. **Schemas derived from established production tooling.** See [References](#references).

---

## Skill Groups

### Pack Management Skills

Seven skills that own the JSON schema and all file I/O for production assets. Each has a JS script exposing CRUD operations via CLI subcommands. No reasoning, no LLM calls.

| Skill | Entity | Scope | Purpose |
|---|---|---|---|
| `project-config` | Project | Per-project | Global seed, style, and project metadata |
| `actor-pack` | Actor | Global reusable | Physical appearance reference (global across projects) |
| `character-pack` | Character | Project-scoped | Composition: one actor + one costume + zero or more props |
| `scene-pack` | Scene | Global reusable | Location/environment reference |
| `prop-pack` | Prop | Global reusable | Physical object reference |
| `costume-pack` | Costume | Global reusable | Clothing/appearance set reference |
| `prompt-template` | PromptTemplate | Global reusable | Reusable prompt templates with `{{variable}}` slots |

### Reasoning Skills

Five skills whose SKILL.md files instruct any agent on what to reason about and which pack management scripts to call for persistence. Scripts handle only validation and file I/O — no LLM calls in code.

| Skill | Purpose | Primary inputs | Primary output |
|---|---|---|---|
| `script-breakdown` | Any text → chapter + indexed shot list | raw text | `chapter.json`, `shot-list.json` |
| `entity-extraction` | Shot list → populate packs | `shot-list.json` | pack files, `extraction-report.json` |
| `shot-detail` | Enrich shots with cinematic parameters | `shot-list.json`, `extraction-report.json`, `shot-details.json` (existing, optional) | `shot-details.json` |
| `consistency-check` | Detect entity/style drift across shots | `shot-list.json`, `shot-details.json`, `extraction-report.json`, packs | `consistency-report.json` |
| `production-pipeline` | Orchestrate reasoning skills for a chapter | any text or existing chapter | all reasoning skill outputs |

### Full Pipeline Skills

Two skills that wire the complete end-to-end workflow for a specific production type. Each invokes `production-pipeline` internally as the chapter-level orchestrator.

| Skill | Purpose |
|---|---|
| `shorts-production-pipeline` | Full short film/drama workflow: text → breakdown → extraction → shot-detail → consistency → video generation |
| `mv-production-pipeline` | Full music video workflow: lyrics/audio → breakdown → extraction → shot-detail → consistency → seedance generation → compilation |

---

## Directory Layout

```
skills/
  # Workflow Skills (gates — mandatory before/between production work)
  brainstorming/
    SKILL.md
  project-setup/
    SKILL.md
    scripts/
      setup.js
      setup.__test__.js
  writing-plans/
    SKILL.md
  requesting-review/
    SKILL.md

  # Pack Management Skills
  project-config/
    SKILL.md
    scripts/
      project-config.js
      project-config.__test__.js
  actor-pack/
    SKILL.md
    scripts/
      actor-pack.js
      actor-pack.__test__.js
  character-pack/
    SKILL.md
    scripts/
      character-pack.js
      character-pack.__test__.js
  scene-pack/
    SKILL.md
    scripts/
      scene-pack.js
      scene-pack.__test__.js
  prop-pack/
    SKILL.md
    scripts/
      prop-pack.js
      prop-pack.__test__.js
  costume-pack/
    SKILL.md
    scripts/
      costume-pack.js
      costume-pack.__test__.js
  prompt-template/
    SKILL.md
    scripts/
      prompt-template.js
      prompt-template.__test__.js

  # Reasoning Skills
  script-breakdown/
    SKILL.md
    scripts/
      validate-shot-list.js
      validate-shot-list.__test__.js
  shot-detail/
    SKILL.md
    scripts/
      validate-shot-details.js
      validate-shot-details.__test__.js
  entity-extraction/
    SKILL.md
    scripts/
      validate-extraction-report.js
      validate-extraction-report.__test__.js
  consistency-check/
    SKILL.md
    scripts/
      validate-consistency-report.js
      validate-consistency-report.__test__.js
  production-pipeline/
    SKILL.md
    references/
      workflow.md

  # Full Pipeline Skills
  shorts-production-pipeline/
    SKILL.md
  mv-production-pipeline/
    SKILL.md
```

---

## File System Layout at Runtime

All files for a project live under a single user-specified `--base-dir` (defaults to `assets/`).

```
<base-dir>/
  project.json                         # project config (seed, style, etc.)

  global/                              # global assets — reusable across projects
    actors/<actor-id>/
      pack.json
      images/                          # reference images (user-managed, not generated)
    scenes/<scene-id>/
      pack.json
      images/
    props/<prop-id>/
      pack.json
      images/
    costumes/<costume-id>/
      pack.json
      images/
    templates/<template-id>/
      template.json

  characters/<character-id>/           # project-scoped: actor + costume + props composition
    pack.json

  chapters/<chapter-id>/               # all files for a chapter share this directory
    chapter.json                       # chapter metadata + raw/condensed text
    shot-list.json                     # indexed shot array (output of script-breakdown)
    shot-details.json                  # per-shot cinematic detail (output of shot-detail)
    extraction-report.json             # entity refs per shot (output of entity-extraction)
    consistency-report.json            # drift issues (output of consistency-check)
```

**Chapter directory convention:** the chapter ID is the directory name under `chapters/`. All Layer 2 inputs and outputs for a chapter are colocated there. Scripts that take a chapter as input accept `--chapter-dir <base-dir>/chapters/<chapter-id>`.

---

## ID Generation

All IDs follow the pattern `<prefix>_<timestamp_base36>`, generated by pack scripts. If two IDs are generated within the same millisecond, a counter suffix is appended (`<prefix>_<timestamp_base36>_<n>`).

**Canonical prefix list:**

| Prefix | Entity |
|---|---|
| `proj_` | Project |
| `chap_` | Chapter |
| `actor_` | Actor |
| `char_` | Character |
| `scene_` | Scene |
| `prop_` | Prop |
| `costume_` | Costume |
| `tmpl_` | PromptTemplate |

---

## Schema Versioning

Every JSON file includes a `"$schemaVersion": "1.0"` field at the top level. Pack scripts validate this field on read and reject files with unknown versions. Version increments are additive (new optional fields) until a breaking change requires a major bump.

---

## JSON Schemas

### `project.json`

```json
{
  "$schemaVersion": "1.0",
  "id": "proj_lz4x7",
  "title": "Song or Film Title",
  "description": "",
  "style": "cinematic noir, urban, gritty",
  "visualStyle": "live_action",
  "seed": 42,
  "unifyStyle": true,
  "defaultModel": "seedance15",
  "aspectRatio": "9:16",
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T00:00:00Z"
}
```

`style` is a free-form string (not an enum — production genres are too varied). `visualStyle`: `"live_action" | "anime"`. `seed` and `unifyStyle` are the anti-drift anchor inherited by all shots unless overridden at the shot level.

---

### `global/actors/<id>/pack.json`

An actor is a global, reusable physical appearance reference — the "look" of a performer, independent of any project role.

```json
{
  "$schemaVersion": "1.0",
  "id": "actor_lz4x7",
  "name": "Mia",
  "description": "Lead performer, rebellious energy",
  "appearance": "short black hair, slim build, ~20s, distinctive freckles",
  "tags": ["lead", "female"],
  "viewCount": 1,
  "promptTemplateId": null,
  "images": [
    {
      "viewAngle": "FRONT",
      "qualityLevel": "LOW",
      "path": "./images/front.jpg",
      "width": null,
      "height": null,
      "format": "jpg",
      "isPrimary": true
    }
  ],
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T00:00:00Z"
}
```

`viewAngle`: `"FRONT" | "LEFT" | "RIGHT" | "BACK" | "THREE_QUARTER" | "TOP" | "DETAIL"`.
`qualityLevel`: `"LOW" | "MEDIUM" | "HIGH" | "ULTRA"`.
`viewCount`: the planned number of view-angle images to generate for this asset (e.g. `1` = front only, `4` = front/left/right/back). Used by image-generation steps to know how many slots to fill. Does not enforce a constraint — it is advisory.

---

### `characters/<id>/pack.json`

A character is project-scoped. It composes one actor (appearance) + one optional costume + zero or more props into a named role for a specific production.

```json
{
  "$schemaVersion": "1.0",
  "id": "char_lz4x8",
  "name": "Mia — Stage Role",
  "description": "Project-specific role description",
  "actorId": "actor_lz4x7",
  "costumeId": "costume_lz4xa",
  "propIds": ["prop_lz4xb"],
  "images": [
    {
      "viewAngle": "FRONT",
      "qualityLevel": "LOW",
      "path": "./images/front.jpg",
      "isPrimary": true
    }
  ],
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T00:00:00Z"
}
```

`actorId` is required; `costumeId` and `propIds` are optional. Images here are character-specific renders (actor + costume + props composed together, distinct from the actor's standalone images).

Image sub-schema (same as actor images):
```json
{
  "viewAngle": "FRONT",
  "qualityLevel": "LOW",
  "path": "./images/front.jpg",
  "width": null,
  "height": null,
  "format": "jpg",
  "isPrimary": true
}
```

---

### `global/scenes/<id>/pack.json`

```json
{
  "$schemaVersion": "1.0",
  "id": "scene_lz4x9",
  "name": "Rooftop at Sunset",
  "description": "Urban rooftop, haze, golden hour light, graffiti walls",
  "tags": ["exterior", "urban", "dusk"],
  "viewCount": 1,
  "promptTemplateId": null,
  "images": [
    {
      "viewAngle": "FRONT",
      "qualityLevel": "LOW",
      "path": "./images/ref.jpg",
      "isPrimary": true
    }
  ],
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T00:00:00Z"
}
```

---

### `global/props/<id>/pack.json`

```json
{
  "$schemaVersion": "1.0",
  "id": "prop_lz4xb",
  "name": "Vintage Guitar",
  "description": "Worn sunburst Telecaster, scratched body",
  "tags": ["instrument", "music"],
  "viewCount": 1,
  "promptTemplateId": null,
  "images": [],
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T00:00:00Z"
}
```

---

### `global/costumes/<id>/pack.json`

```json
{
  "$schemaVersion": "1.0",
  "id": "costume_lz4xa",
  "name": "Stage Outfit — Black Leather",
  "description": "Black leather jacket, torn jeans, worn boots",
  "tags": ["stage", "rock"],
  "viewCount": 1,
  "promptTemplateId": null,
  "images": [],
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T00:00:00Z"
}
```

---

### `global/templates/<id>/template.json`

```json
{
  "$schemaVersion": "1.0",
  "id": "tmpl_lz4xc",
  "category": "video_prompt",
  "name": "High-Energy Performance",
  "preview": "Performance shot with dynamic lighting and intense energy",
  "content": "{{character}} performing with intense energy, {{cameraMovement}}, {{lighting}}, cinematic 35mm",
  "variables": ["character", "cameraMovement", "lighting"],
  "isDefault": false,
  "isSystem": false,
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T00:00:00Z"
}
```

`category` values: `"video_prompt" | "storyboard_prompt" | "bgm" | "sfx" | "character_image_front" | "character_image_other" | "actor_image_front" | "actor_image_other" | "prop_image_front" | "prop_image_other" | "scene_image_front" | "scene_image_other" | "costume_image_front" | "costume_image_other" | "frame_head_image" | "frame_tail_image" | "frame_key_image" | "frame_head_prompt" | "frame_tail_prompt" | "frame_key_prompt" | "combined"`.

`{{variable}}` syntax; agents substitute values when applying a template to a shot.

---

### `chapters/<id>/chapter.json`

```json
{
  "$schemaVersion": "1.0",
  "id": "chap_lz4xd",
  "index": 1,
  "title": "Act 1 — The Meeting",
  "summary": "",
  "rawText": "Full original script/lyric text for this chapter (unmodified)",
  "condensedText": "Agent-simplified version used for shot extraction (shorter, cleaner)",
  "status": "draft",
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T00:00:00Z"
}
```

`status`: `"draft" | "shooting" | "done"`. `condensedText` is produced by the agent during `script-breakdown`; it is the version used by downstream skills.

---

### `chapters/<id>/shot-list.json`

```json
{
  "$schemaVersion": "1.0",
  "chapterId": "chap_lz4xd",
  "generatedAt": "2026-03-27T00:00:00Z",
  "shots": [
    {
      "index": 1,
      "title": "Opening — empty stage",
      "scriptExcerpt": "The lights go down, the crowd goes silent.",
      "characterNames": ["Mia"],
      "sceneNames": ["Empty Stage"],
      "status": "pending"
    }
  ]
}
```

`characterNames` and `sceneNames` are raw name strings extracted from the condensed text. They are resolved to pack IDs by `entity-extraction` and stored in `extraction-report.json`. Shot status: `"pending" | "generating" | "ready"`.

Note: `sceneNames` is an array to handle shots that span multiple locations (e.g. a cross-cut or split-screen).

---

### `chapters/<id>/shot-details.json`

Shot details are written after `entity-extraction` completes, so `sceneIds` can reference valid pack IDs. Character and actor references per shot live in `extraction-report.json`, not here — that separation avoids duplication and keeps shot-details focused on cinematic parameters.

```json
{
  "$schemaVersion": "1.0",
  "chapterId": "chap_lz4xd",
  "generatedAt": "2026-03-27T00:00:00Z",
  "details": [
    {
      "shotIndex": 1,
      "cameraShot": "MS",
      "angle": "EYE_LEVEL",
      "movement": "STATIC",
      "sceneIds": ["scene_lz4x9"],
      "duration": 4,
      "moodTags": ["melancholic", "anticipation"],
      "atmosphere": "dim stage lights, dust particles in air, slow fog machine haze",
      "followAtmosphere": true,
      "hasBgm": true,
      "vfxType": "VOLUMETRIC_FOG",
      "vfxNote": "low-lying fog across stage floor",
      "description": "Wide shot of empty stage, single spotlight center stage",
      "promptTemplateId": null,
      "firstFramePrompt": "Empty stage, single spotlight center, dust particles, no people",
      "lastFramePrompt": "Character enters stage left into spotlight, silhouette",
      "keyFramePrompt": "",
      "dialogLines": []
    }
  ]
}
```

`cameraShot`: `"ECU" | "CU" | "MCU" | "MS" | "MLS" | "LS" | "ELS"`.
`angle`: `"EYE_LEVEL" | "HIGH_ANGLE" | "LOW_ANGLE" | "BIRD_EYE" | "DUTCH" | "OVER_SHOULDER"`.
`movement`: `"STATIC" | "PAN" | "TILT" | "DOLLY_IN" | "DOLLY_OUT" | "TRACK" | "CRANE" | "HANDHELD" | "STEADICAM" | "ZOOM_IN" | "ZOOM_OUT"`.
`vfxType`: `"NONE" | "PARTICLES" | "VOLUMETRIC_FOG" | "CG_DOUBLE" | "DIGITAL_ENVIRONMENT" | "MATTE_PAINTING" | "FIRE_SMOKE" | "WATER_SIM" | "DESTRUCTION" | "ENERGY_MAGIC" | "COMPOSITING_CLEANUP" | "SLOW_MOTION_TIME" | "OTHER"`.
`duration`: integer, unit is **seconds**.
`followAtmosphere`: when `true`, the agent inherits the `atmosphere` value from the previous shot that has `followAtmosphere: false` (the atmosphere "source" shot). When `false`, this shot defines a new atmosphere that subsequent shots may inherit. This is how consistent visual atmosphere is propagated across a sequence without repeating it in every shot.
`moodTags`: free-form strings. Suggested vocabulary: `"melancholic" | "energetic" | "tense" | "romantic" | "mysterious" | "playful" | "hopeful" | "desperate" | "triumphant" | "serene"`. Not enum-enforced — agents may add domain-specific tags.

`dialogLines` array schema — placed in `shot-details.json` (not `shot-list.json`) because dialog belongs to the cinematic enrichment pass, not the initial breakdown. Breakdown only extracts character names; dialog text is added by the agent during `shot-detail`.
```json
{
  "index": 0,
  "text": "I've been waiting for this moment.",
  "lineMode": "DIALOGUE",
  "speakerName": "Mia",
  "targetName": null
}
```
`lineMode`: `"DIALOGUE" | "VOICE_OVER" | "OFF_SCREEN" | "PHONE"`.

---

### `chapters/<id>/extraction-report.json`

#### actorIds vs characterIds per shot

- **`actorIds`**: global actor pack IDs referenced in this shot. Populated whenever an actor's physical appearance is relevant (whether or not a project-scoped character exists yet).
- **`characterIds`**: project-scoped character pack IDs referenced in this shot. A character links one actor + costume + props. `characterIds` is populated only after the agent has created character packs that compose the relevant actors. It may be empty for a shot even if `actorIds` is non-empty — this is valid and expected early in a project.
- **Relationship**: every character has exactly one actor. If `characterIds` is non-empty, the corresponding actor IDs will also appear in `actorIds`. `actorIds` may contain IDs not in `characterIds` (actors without a character composition yet).

`newEntities` lists IDs of packs created during this extraction run. `characters` is omitted — character creation (composing actor + costume + props into a named role) is a deliberate separate step performed by the agent after reviewing extracted actors, not done automatically during extraction.

```json
{
  "$schemaVersion": "1.0",
  "chapterId": "chap_lz4xd",
  "generatedAt": "2026-03-27T00:00:00Z",
  "shotEntityRefs": [
    {
      "shotIndex": 1,
      "actorIds": ["actor_lz4x7"],
      "characterIds": [],
      "sceneIds": ["scene_lz4x9"],
      "propIds": ["prop_lz4xb"],
      "costumeIds": []
    }
  ],
  "newEntities": {
    "actors": ["actor_lz4x7"],
    "scenes": ["scene_lz4x9"],
    "props": [],
    "costumes": []
  }
}
```

---

### `chapters/<id>/consistency-report.json`

Consistency check reads `shot-list.json` + `shot-details.json` + `extraction-report.json` + referenced pack files. `shot-details.json` is required for `style_deviation` detection (atmosphere, VFX, and mood-tag drift across shots).

```json
{
  "$schemaVersion": "1.0",
  "chapterId": "chap_lz4xd",
  "generatedAt": "2026-03-27T00:00:00Z",
  "issues": [
    {
      "type": "character_drift",
      "shotIndices": [3, 7],
      "entityId": "actor_lz4x7",
      "entityType": "actor",
      "description": "Mia described with 'red hair' in shot 3 but 'black hair' in shot 7",
      "suggestion": "Standardize to 'short black hair' per actor pack appearance field"
    }
  ],
  "optimizedShotList": {
    "$schemaVersion": "1.0",
    "chapterId": "chap_lz4xd",
    "generatedAt": "2026-03-27T00:00:00Z",
    "shots": [
      {
        "index": 1,
        "title": "Opening — empty stage",
        "scriptExcerpt": "The lights go down, the crowd goes silent.",
        "characterNames": ["Mia"],
        "sceneNames": ["Empty Stage"],
        "status": "pending"
      },
      {
        "index": 3,
        "title": "Mia enters spotlight",
        "scriptExcerpt": "She steps forward, short black hair catching the light.",
        "characterNames": ["Mia"],
        "sceneNames": ["Empty Stage"],
        "status": "pending"
      }
    ]
  }
}
```

`type`: `"character_drift" | "scene_drift" | "prop_mismatch" | "costume_change_unintended" | "style_deviation"`.

`optimizedShotList` is `null` when no optimization was run. When present, it is a complete `shot-list.json`-compatible object (same schema, same `$schemaVersion`). The agent may write it directly to `shot-list.json` after user review.

---

## Script CLI Contract

Every pack management script follows this interface:

```bash
pnpm exec dotenv -- node skills/<pack-name>/scripts/<pack-name>.js <subcommand> [options]

# Subcommands (all packs)
create   --base-dir <path> --name <str> [--description <str>] [--tags <json-array>]
read     --base-dir <path> --id <id>
update   --base-dir <path> --id <id> [--name <str>] [--description <str>] [--tags <json-array>]
delete   --base-dir <path> --id <id>
list     --base-dir <path> [--filter <keyword>]
```

`--base-dir` is always the project root directory (same value passed to all commands). Scripts resolve global asset paths as `<base-dir>/global/<entity-type>/<id>/` and project-scoped paths as `<base-dir>/characters/<id>/`.

**Entity-specific extra flags:**

`character-pack create/update`:
```bash
--actor-id <id>          # required on create; references global/actors/<id>/pack.json
--costume-id <id>        # optional; references global/costumes/<id>/pack.json
--prop-ids <json-array>  # optional; e.g. '["prop_lz4xb"]'
```

`prompt-template create/update`:
```bash
--category <category>    # required on create; one of the PromptCategory values
--content <str>          # required on create; template string with {{variable}} slots
--variables <json-array> # required on create; e.g. '["character","cameraMovement"]'
--preview <str>          # optional; short human-readable description
--is-default             # flag; marks this as the default template for its category
```

`actor-pack / scene-pack create/update`:
```bash
--appearance <str>       # actor-pack only; free-form appearance description
```

Output is always a JSON object to stdout. Errors go to stderr with a non-zero exit code and a `{ "error": "<message>" }` JSON body.

Layer 2 validator scripts follow:

```bash
pnpm exec dotenv -- node skills/<skill-name>/scripts/validate-<file>.js --file <path>
```

Exits 0 on valid, 1 on invalid (with error details to stderr).

---

## Reasoning Skill SKILL.md Format

Every reasoning skill's `SKILL.md` must include these sections:

```markdown
---
name: <skill-name>
description: <one-line trigger description, max 200 chars>
---

# <Skill Title>

<One paragraph: what this skill does and when to use it.>

## Inputs

List of required and optional inputs with their file paths and formats.

## Dependencies

Other skills that must run before this one, and what outputs they produce that this skill needs.

## Workflow

Numbered steps the agent follows. Each step either:
- Calls a Layer 1 script (show the exact command)
- Performs a reasoning step (describe what to think/decide)
- Writes an output file (describe the schema section to follow)

## Output

File(s) produced, their paths relative to `--chapter-dir` or `--base-dir`, and their schema.

## Validation

Command to validate the output after writing.

## Error Handling

What to do if a step fails or produces unexpected results.
```

---

## `production-pipeline/references/workflow.md` Format

This file is a numbered checklist used by the `production-pipeline` skill SKILL.md. Format:

```markdown
# Chapter Production Workflow

## Step 1 — Script Breakdown
- Skill: `script-breakdown`
- Input: raw text (provided by user or from `chapter.json#rawText`)
- Output: `chapters/<id>/chapter.json`, `chapters/<id>/shot-list.json`
- Decision: if condensedText changes meaning significantly, flag for user review before continuing

## Step 2 — Entity Extraction
- Skill: `entity-extraction`
- Input: `shot-list.json`
- Output: pack files under `global/` and `characters/`, `extraction-report.json`
- Decision: for each new entity name, check if a matching pack already exists before creating a new one (fuzzy name match)

## Step 3 — Shot Detail
- Skill: `shot-detail`
- Input: `shot-list.json`, `extraction-report.json`
- Output: `shot-details.json`
- Decision: for shots with multiple sceneIds, pick the dominant scene for atmosphere inheritance

## Step 4 — Consistency Check
- Skill: `consistency-check`
- Input: `shot-list.json`, `shot-details.json`, `extraction-report.json`, relevant pack files
- Output: `consistency-report.json`
- Decision: if issues found, present to user; if optimizedShotList is produced, ask before overwriting shot-list.json
```

---

## Data Flow

```
[Any text input]
      │
      ▼
script-breakdown
      │
      ├─► chapter.json
      └─► shot-list.json
                │
                ▼
        entity-extraction ──────────────────► global/actors/, global/scenes/,
                │                             global/props/, global/costumes/,
                └─► extraction-report.json    characters/
                          │
                          │  (+ shot-list.json + extraction-report.json)
                          ▼
                    shot-detail
                          │
                          └─► shot-details.json
                                    │
                                    │  (+ shot-list.json + extraction-report.json + packs)
                                    ▼
                            consistency-check
                                    │
                                    └─► consistency-report.json
                                              │
                                              ▼
                                    [optimized shot-list.json] (optional, user-reviewed)
                                              │
                                              ▼
                               [video generation skills]
```

---

## Integration with Existing Skills

The new pipeline slots between storyboard/script work and video generation.

**`mv-production-pipeline` workflow (sequential):**
```
writing-lyrics              ← write song lyrics
  → generating-song         ← generate audio from lyrics + style
  → lyrics-force-alignment  ← align lyrics to generated audio
  → mv-storyboard-writer    ← write lyric-driven storyboard
  → production-pipeline
      → script-breakdown    ← lyrics/storyboard → shot list
      → entity-extraction   ← shots → packs
      → shot-detail         ← cinematic parameters
      → consistency-check   ← drift detection
  → seedance15-prompt-writer
  → seedance15-generate     ← per scene
  → video-upscale           ← optional
  → mv-compilation
```

**`shorts-production-pipeline` workflow (sequential):**
```
[screenplay or story brief]
  → production-pipeline
      → script-breakdown (script → shot list)
      → entity-extraction (shots → packs)
      → shot-detail (cinematic parameters)
      → consistency-check (drift detection)
  → [image/video generation per shot]
  → [post-production assembly]
```

**`seedance15-prompt-writer` integration:** `seedance15-prompt-writer` is an existing Violyra skill (see `skills/seedance15-prompt-writer/SKILL.md`) that writes motion-focused prompts for Seedance text-to-video and image-to-video generation. Shot detail fields feed into it as follows:

| Shot detail field | Prompt-writer input |
|---|---|
| `cameraShot` | framing descriptor (e.g. `"MS"` → `"medium shot"`) |
| `angle` | camera angle descriptor |
| `movement` | camera movement descriptor |
| `atmosphere` | environment/lighting context |
| `moodTags` | emotional tone modifiers |
| `firstFramePrompt` | image-to-video start frame prompt |
| `lastFramePrompt` | image-to-video end frame prompt |
| `sceneIds` → scene pack `name` + `description` | location context |
| `description` | shot overview / supplement |

---

## Testing Strategy

- Every pack management script has `__test__.js` covering: create, read, update, delete, list, invalid input, missing base-dir.
- Every reasoning skill has a `validate-<file>.js` script with `__test__.js` covering: valid fixture, missing required fields, unknown `$schemaVersion`, wrong field types.
- Run all tests: `pnpm test`.

---

## Open Questions (Resolved)

| Question | Decision |
|---|---|
| Database? | No. JSON files only. |
| LLM calls in scripts? | No. Agent-agnostic SKILL.md instructions only. |
| UI? | No. CLI-first. |
| Actor vs Character split? | Yes. Actor = global reusable appearance; Character = project-scoped composition. |
| Costume separate from Prop? | Yes, separate packs. |
| ID format | `<prefix>_<timestamp_base36>` generated by pack scripts. |
| Base dir default | `assets/` — consistent with existing Violyra convention. |
| newEntities omits characters? | By design — character creation is a deliberate agent step, not auto-extraction. |
| Single sceneId per shot? | No — `sceneIds` is an array to support multi-location shots. |
| Schema versioning? | `"$schemaVersion": "1.0"` on every file; pack scripts validate on read. |

---

## Operational Conventions

### Re-running entity-extraction

When `entity-extraction` runs again on the same chapter (e.g. after the shot list is updated):
1. For each entity name in the new shot list, first call `list --filter <name>` on the relevant pack script to check for an existing pack (fuzzy match by name).
2. If a matching pack is found, reuse its ID — do not create a duplicate.
3. Update `extraction-report.json` in full (overwrite, not merge). The report always reflects the current shot list.
4. Packs already created in a previous run are never deleted by re-extraction. Only `extraction-report.json` and new pack entries are affected.

### Multi-chapter projects and shared character packs

Characters and global assets (actors, scenes, props, costumes) live at the project level (`<base-dir>/characters/` and `<base-dir>/global/`), not inside chapter directories. All chapters in a project share the same pack files. When two chapters reference the same character name, `entity-extraction` reuses the same pack ID (via the fuzzy name match above). This is the mechanism for cross-chapter consistency.

### `production-pipeline/references/workflow.md`

This file must be created as part of implementing the `production-pipeline` skill. It is a numbered step checklist (format defined in the `production-pipeline/references/workflow.md Format` section above) committed at `skills/production-pipeline/references/workflow.md`. The `production-pipeline` SKILL.md references it directly.

---

## References

- [superpowers](https://github.com/anthropics/claude-code) — skill repository structure and agent-agnostic SKILL.md pattern
- [Jellyfish](https://github.com/Forget-C/Jellyfish) — production pipeline feature set and data model
- [huobao-drama](https://github.com/chatfire-AI/huobao-drama) — short drama production feature set
