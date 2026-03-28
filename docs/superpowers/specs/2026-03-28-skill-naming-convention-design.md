---
title: Skill Naming Convention & Dotenv Usage Update
date: 2026-03-28
status: approved
---

# Skill Naming Convention & Dotenv Usage Update

## Goal

Establish a consistent `gerund-object` naming pattern across all non-utility skills, and remove `pnpm exec dotenv --` from usage strings in favor of `source .env`.

## Naming Convention

All non-utility skills use the pattern `<gerund>-<object>` (e.g., `aligning-lyrics`, `generating-voiceover`).

**Utilities (unchanged):** `lib`, `replicate`, `prompt-template`

**Pack skills (already correct, unchanged):** `generating-actor-pack`, `generating-character-pack`, `generating-costume-pack`, `generating-prop-pack`, `generating-scene-pack`

## Rename Map

| Current | New |
|---|---|
| `generate-voiceover` | `generating-voiceover` |
| `lyrics-force-alignment` | `aligning-lyrics` |
| `mv-storyboard-writer` | `writing-video-plan` |
| `script-breakdown` | `breaking-down-video-script` |
| `entity-extraction` | `extracting-video-entities` |
| `shot-detail` | `enriching-shot-details` |
| `mv-compilation` | `compiling-video` |
| `upscale-video` | `upscaling-video` |
| `download-youtube-video` | `downloading-youtube-video` |
| `extract-foreground` | `extracting-foreground` |
| `generate-thumbnail` | `generating-thumbnail` |
| `consistency-check` | `checking-consistency` |
| `production-pipeline` | `running-production-pipeline` |
| `seedance15-generate` | `generating-seedance15-video` |
| `seedance15-prompt-writer` | `writing-seedance15-prompt` |

## Changes Per Rename

For each renamed skill, update:

1. **Directory name** — `git mv skills/<old> skills/<new>`
2. **`SKILL.md` `name:` frontmatter** — match new directory name
3. **Usage strings in scripts** — update hardcoded skill path in CLI_SCRIPT_PATH constants and usage block text
4. **Cross-skill imports** — update relative import paths that reference old skill directory names (e.g., `../../upscale-video/scripts/upscale.js` → `../../upscaling-video/scripts/upscale.js`)

## Dotenv Usage String Update

Anywhere a script usage block currently reads:

```
pnpm exec dotenv -- node <path> ...
```

Replace with:

```
source .env && node <path> ...
# or: source ~/.config/violyra/.env && node <path> ...
```

No runtime logic changes. `process.env.*` reads remain as-is.

## Docs Updates

Scan and update all references to old skill names in:

- `docs/design-docs/` (all `.md` files)
- `docs/design.md`
- `docs/installation.md`
- `docs/testing.md`

## What Does NOT Change

- Script filenames (`align.js`, `compile.js`, `chatterbox_tts.js`, etc.)
- SKILL.md `description:` content
- All runtime logic and `process.env.*` reads
- Test files
- `docs/`, `packages/`, `hooks/` structure
