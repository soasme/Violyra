# Production Pipeline Design

**Date:** 2026-03-27
**Status:** Draft

## Overview

This document describes the design for bringing Jellyfish-inspired production pipeline capabilities into Violyra. The goal is to add structured asset management (character, scene, prop, costume, actor packs), fine-grained shot control, entity extraction from raw text, cross-scene consistency checking, and full-pipeline orchestration — all as CLI-first, agent-agnostic skills with no database and no UI.

Reference: [Jellyfish](https://github.com/Forget-C/Jellyfish) — an AI short drama studio with entity lifecycle management, shot fine control, and consistency enforcement.

---

## Design Goals

1. **No database, no UI.** All state lives in JSON files on disk. User specifies a base directory.
2. **Agent-agnostic.** SKILL.md files contain instructions; any AI agent can follow them. No LLM calls in code.
3. **CLI-first scripts.** JS scripts handle all file I/O, schema validation, and non-LLM transforms. Flags, defaults, `--help`.
4. **Composable two-layer architecture.** Pack management (data layer) + reasoning skills (agent instruction layer).
5. **Jellyfish-informed schemas.** JSON schemas derived from Jellyfish's SQLAlchemy models, adapted for flat-file storage.

---

## Two-Layer Architecture

### Layer 1 — Pack Management (Data Layer)

Seven skills that own the JSON schema and all file I/O. Each has a JS script exposing CRUD operations via CLI subcommands.

| Skill | Entity | Scope | Maps to Jellyfish |
|---|---|---|---|
| `project-config` | Project | Per-project | `Project` |
| `actor-pack` | Actor | Global reusable | `Actor` |
| `character-pack` | Character | Project-scoped | `Character` (Actor + Costume + Props) |
| `scene-pack` | Scene | Global reusable | `Scene` |
| `prop-pack` | Prop | Global reusable | `Prop` |
| `costume-pack` | Costume | Global reusable | `Costume` |
| `prompt-template` | PromptTemplate | Global reusable | `PromptTemplate` |

### Layer 2 — Reasoning (Agent Instruction Layer)

Five skills that tell the agent what to think and which Layer 1 scripts to invoke for persistence. No LLM calls in code.

| Skill | Purpose | Maps to Jellyfish |
|---|---|---|
| `script-breakdown` | Any text → indexed shot list + condensed script | Chapter (raw_text → condensed_text → shots) |
| `shot-detail` | Enrich each shot with cinematic parameters | `ShotDetail` |
| `entity-extraction` | Shot list → populate packs (actors, scenes, props, costumes) | ImportDraft pipeline |
| `consistency-check` | Detect character/scene drift across shots | Script consistency + optimization |
| `production-pipeline` | Orchestrate the full workflow | Full chapter workflow |

---

## Directory Layout

```
skills/
  # Layer 1 — Pack Management
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

  # Layer 2 — Reasoning
  script-breakdown/
    SKILL.md
    scripts/
      validate-shot-list.js
      validate-shot-list.__test__.js
  shot-detail/
    SKILL.md
  entity-extraction/
    SKILL.md
  consistency-check/
    SKILL.md
  production-pipeline/
    SKILL.md
    references/
      workflow.md
```

---

## File System Layout at Runtime

```
<base-dir>/                          # user-specified, defaults to assets/
  project.json                       # project config (seed, style, etc.)
  global/
    actors/<id>/
      pack.json
      images/                        # reference images (user-managed)
    scenes/<id>/
      pack.json
      images/
    props/<id>/
      pack.json
      images/
    costumes/<id>/
      pack.json
      images/
    templates/<id>/
      template.json
  characters/<id>/
    pack.json                        # project-scoped: actor_id + costume_id + prop_ids
  chapters/<chapter-id>/
    chapter.json                     # chapter metadata + raw/condensed text
    shot-list.json                   # indexed shot array
    shot-details.json                # per-shot cinematic detail (parallel array by shot index)
    extraction-report.json           # entity refs per shot (output of entity-extraction)
    consistency-report.json          # drift issues (output of consistency-check)
```

Global assets (`global/`) are reusable across projects. Characters are project-scoped (they compose global actors, costumes, props).

---

## JSON Schemas

### `project.json`

```json
{
  "id": "proj_001",
  "title": "Song Title",
  "description": "",
  "style": "cinematic",
  "visualStyle": "live_action",
  "seed": 42,
  "unifyStyle": true,
  "defaultModel": "seedance15",
  "aspectRatio": "16:9",
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T00:00:00Z"
}
```

`style` is a free-form string (not an enum, unlike Jellyfish — music videos span more genres). `visualStyle`: `"live_action" | "anime"`. `seed` + `unifyStyle` are the anti-drift anchor inherited by all shots unless overridden.

---

### `global/actors/<id>/pack.json`

```json
{
  "id": "actor_001",
  "name": "Mia",
  "description": "Lead vocalist, rebellious energy",
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

---

### `characters/<id>/pack.json`

```json
{
  "id": "char_001",
  "name": "Mia (MV Lead)",
  "description": "Project-specific appearance for this MV",
  "actorId": "actor_001",
  "costumeId": "costume_001",
  "propIds": ["prop_001"],
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

`actorId`, `costumeId`, `propIds` reference global assets by ID. `images` are character-specific renders (actor + costume + props composed).

---

### `global/scenes/<id>/pack.json`

```json
{
  "id": "scene_001",
  "name": "Rooftop at Sunset",
  "description": "Urban rooftop, haze, golden hour light",
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
  "id": "prop_001",
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
  "id": "costume_001",
  "name": "Stage Outfit — Black Leather",
  "description": "Black leather jacket, torn jeans, boots",
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
  "id": "tmpl_001",
  "category": "video_prompt",
  "name": "Chorus Energy Shot",
  "preview": "High-energy performance shot with dynamic lighting",
  "content": "{{character}} performing with intense energy, {{cameraMovement}}, {{lighting}}, cinematic 35mm",
  "variables": ["character", "cameraMovement", "lighting"],
  "isDefault": false,
  "isSystem": false,
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T00:00:00Z"
}
```

`category` values (from Jellyfish `PromptCategory`): `"video_prompt" | "storyboard_prompt" | "bgm" | "sfx" | "character_image_front" | "character_image_other" | "actor_image_front" | "actor_image_other" | "prop_image_front" | "prop_image_other" | "scene_image_front" | "scene_image_other" | "costume_image_front" | "costume_image_other" | "frame_head_image" | "frame_tail_image" | "frame_key_image" | "frame_head_prompt" | "frame_tail_prompt" | "frame_key_prompt" | "combined"`.

`{{variable}}` syntax for agent interpolation.

---

### `chapters/<id>/chapter.json`

```json
{
  "id": "chap_001",
  "index": 1,
  "title": "Verse 1",
  "summary": "",
  "rawText": "Full original lyrics / script text for this chapter",
  "condensedText": "Model-simplified version used for shot extraction",
  "status": "draft",
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T00:00:00Z"
}
```

`status`: `"draft" | "shooting" | "done"`.

---

### `chapters/<id>/shot-list.json`

```json
{
  "chapterId": "chap_001",
  "generatedAt": "2026-03-27T00:00:00Z",
  "shots": [
    {
      "index": 1,
      "title": "Opening — empty stage",
      "scriptExcerpt": "The lights go down...",
      "characterNames": ["Mia"],
      "sceneName": "Empty Stage",
      "status": "pending"
    }
  ]
}
```

`status` per shot: `"pending" | "generating" | "ready"`. `characterNames` and `sceneName` are raw strings from extraction — resolved to pack IDs in `extraction-report.json`.

---

### `chapters/<id>/shot-details.json`

```json
{
  "chapterId": "chap_001",
  "details": [
    {
      "shotIndex": 1,
      "cameraShot": "MS",
      "angle": "EYE_LEVEL",
      "movement": "STATIC",
      "sceneId": "scene_001",
      "duration": 4,
      "moodTags": ["melancholic", "anticipation"],
      "atmosphere": "dim stage lights, dust particles in air",
      "followAtmosphere": true,
      "hasBgm": true,
      "vfxType": "NONE",
      "vfxNote": "",
      "description": "Wide shot of empty stage, single spotlight",
      "promptTemplateId": null,
      "firstFramePrompt": "Empty stage, single spotlight center, dust particles",
      "lastFramePrompt": "Character enters from stage left, spotlight follows",
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

---

### `chapters/<id>/extraction-report.json`

```json
{
  "chapterId": "chap_001",
  "generatedAt": "2026-03-27T00:00:00Z",
  "shotEntityRefs": [
    {
      "shotIndex": 1,
      "actorIds": ["actor_001"],
      "characterIds": ["char_001"],
      "sceneIds": ["scene_001"],
      "propIds": ["prop_001"],
      "costumeIds": ["costume_001"]
    }
  ],
  "newEntities": {
    "actors": ["actor_001"],
    "scenes": ["scene_001"],
    "props": [],
    "costumes": []
  }
}
```

---

### `chapters/<id>/consistency-report.json`

```json
{
  "chapterId": "chap_001",
  "generatedAt": "2026-03-27T00:00:00Z",
  "issues": [
    {
      "type": "character_drift",
      "shotIndices": [3, 7],
      "entityId": "actor_001",
      "entityType": "actor",
      "description": "Mia described with 'red hair' in shot 3 but 'black hair' in shot 7",
      "suggestion": "Standardize to 'short black hair' per actor pack"
    }
  ],
  "optimizedShotList": null
}
```

`type`: `"character_drift" | "scene_drift" | "prop_mismatch" | "costume_change_unintended" | "style_deviation"`.
`optimizedShotList`: if the agent ran the optimization step, this contains the corrected shot list inline.

---

## Script CLI Contract

Every pack script follows this interface:

```bash
node skills/<pack-name>/scripts/<pack-name>.js <subcommand> [options]

# Subcommands
create   --base-dir <path> --name <str> [--description <str>] [--tags <json>]
read     --base-dir <path> --id <id>
update   --base-dir <path> --id <id> [--name <str>] [--description <str>]
delete   --base-dir <path> --id <id>
list     --base-dir <path> [--filter <keyword>]
```

Output is always JSON to stdout. Errors go to stderr with non-zero exit code.

ID generation: `<prefix>_<timestamp_base36>` (e.g. `actor_lz4x7`, `scene_lz4x8`). Deterministic within the same millisecond via counter suffix if needed.

---

## Skill Descriptions

### Layer 1 — Pack Management

**`project-config`** — Initialize or update a project config file at `<base-dir>/project.json`. Contains the global seed and style that all shots inherit. Run first before any other skill.

**`actor-pack`** — Manage global reusable actor appearance packs. An actor is a physical appearance reference (name, appearance text, reference images). Global across projects.

**`character-pack`** — Manage project-scoped character compositions. A character links an actor + costume + props into a named role for a specific project.

**`scene-pack`** — Manage global reusable scene/environment packs. A scene is a location reference (name, description, lighting, mood, reference images).

**`prop-pack`** — Manage global reusable prop packs. Props are physical objects that appear in shots.

**`costume-pack`** — Manage global reusable costume packs. Costumes are clothing/appearance sets that can be assigned to characters.

**`prompt-template`** — Manage reusable prompt templates with `{{variable}}` slots. Templates are categorized by use (video_prompt, storyboard_prompt, character_image_front, etc.).

### Layer 2 — Reasoning

**`script-breakdown`** — Takes any text input (lyrics, screenplay, story brief) and produces a `chapter.json` + `shot-list.json`. The agent condenses the raw text, segments it into indexed shots, and identifies character/scene names per shot.

**`shot-detail`** — Takes a `shot-list.json` and enriches each shot with cinematic parameters: camera shot type, angle, movement, mood tags, atmosphere, duration, VFX, and first/last/key frame prompts. Produces `shot-details.json`.

**`entity-extraction`** — Takes a `shot-list.json` and creates/updates actor, scene, prop, and costume packs for all entities mentioned. Links shots to pack IDs in `extraction-report.json`. Calls Layer 1 pack scripts for persistence.

**`consistency-check`** — Reads `shot-list.json` + `extraction-report.json` + relevant packs. Detects character drift, scene drift, prop mismatches, and style deviations. Outputs `consistency-report.json`. Optionally produces an optimized shot list.

**`production-pipeline`** — Orchestrates the full workflow in order: `script-breakdown` → `entity-extraction` → `shot-detail` → `consistency-check` → optional optimization. References `references/workflow.md` for the step-by-step agent guide.

---

## Data Flow

```
[Any text input]
      │
      ▼
script-breakdown
      │ chapter.json + shot-list.json
      ▼
entity-extraction ──────────────────► actor/scene/prop/costume packs (Layer 1)
      │ extraction-report.json
      ▼
shot-detail
      │ shot-details.json
      ▼
consistency-check ──────────────────► reads packs (Layer 1)
      │ consistency-report.json
      ▼
[optimized shot-list.json] (optional)
      │
      ▼
[existing skills: seedance15-generate, mv-compilation, etc.]
```

---

## Integration with Existing Violyra Skills

The new skills slot into the existing workflow between `mv-storyboard-writer` and `seedance15-generate`:

```
download-youtube-video
  → lyrics-force-alignment
  → mv-storyboard-writer
  → [NEW] production-pipeline (script-breakdown → entity-extraction → shot-detail → consistency-check)
  → seedance15-generate (per scene, using enriched shot-details)
  → video-upscale (optional)
  → mv-compilation
```

Shot details (camera_shot, angle, movement, atmosphere, frame prompts) feed directly into `seedance15-prompt-writer` to produce richer, more consistent generation prompts.

---

## Testing Strategy

- Every Layer 1 pack script has `__test__.js` covering: create, read, update, delete, list, invalid input, missing base-dir.
- `validate-shot-list.js` (under `script-breakdown`) validates shot-list.json schema with test fixtures.
- Layer 2 skills have no scripts to test directly — their correctness is validated by checking the JSON outputs they produce against schemas.
- Run all tests: `pnpm test`.

---

## Open Questions (Resolved)

| Question | Decision |
|---|---|
| Database? | No. JSON files only. |
| LLM calls in scripts? | No. Agent-agnostic SKILL.md instructions only. |
| UI? | No. CLI-first. |
| Actor vs Character split? | Yes, mirrors Jellyfish. Actor = global appearance; Character = project composition. |
| Costume separate from Prop? | Yes, separate packs (Jellyfish schema precedent). |
| ID format | `<prefix>_<timestamp_base36>` generated by pack scripts. |
| Base dir default | `assets/` — consistent with existing Violyra convention. |
