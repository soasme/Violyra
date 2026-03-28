# Skill Naming Convention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename 15 skill directories to `gerund-object` naming convention and replace `pnpm exec dotenv --` with `source .env &&` in all usage strings.

**Architecture:** Each task renames one or more skill directories with `git mv`, then updates all internal references (SKILL.md `name:` field, CLI_SCRIPT_PATH constants, usage strings, cross-skill imports). Docs are updated last. Tests are run after all renames to confirm nothing broke.

**Tech Stack:** Node.js ESM, pnpm, vitest, git

---

## File Map

**Skill directories renamed (15):**

| Old path | New path |
|---|---|
| `skills/generate-voiceover` | `skills/generating-voiceover` |
| `skills/lyrics-force-alignment` | `skills/aligning-lyrics` |
| `skills/mv-storyboard-writer` | `skills/writing-video-plan` |
| `skills/script-breakdown` | `skills/breaking-down-video-script` |
| `skills/entity-extraction` | `skills/extracting-video-entities` |
| `skills/shot-detail` | `skills/enriching-shot-details` |
| `skills/mv-compilation` | `skills/compiling-video` |
| `skills/upscale-video` | `skills/upscaling-video` |
| `skills/download-youtube-video` | `skills/downloading-youtube-video` |
| `skills/extract-foreground` | `skills/extracting-foreground` |
| `skills/generate-thumbnail` | `skills/generating-thumbnail` |
| `skills/consistency-check` | `skills/checking-consistency` |
| `skills/production-pipeline` | `skills/running-production-pipeline` |
| `skills/seedance15-generate` | `skills/generating-seedance15-video` |
| `skills/seedance15-prompt-writer` | `skills/writing-seedance15-prompt` |

**Scripts with CLI_SCRIPT_PATH and/or cross-skill imports to update:**
- `skills/compiling-video/scripts/compile.js` — CLI_SCRIPT_PATH + cross-skill import + dotenv usage string
- `skills/aligning-lyrics/scripts/align.js` — CLI_SCRIPT_PATH + dotenv usage string
- `skills/upscaling-video/scripts/upscale.js` — CLI_SCRIPT_PATH + dotenv usage string
- `skills/generating-thumbnail/scripts/generate.js` — CLI_SCRIPT_PATH + dotenv usage string
- `skills/generating-seedance15-video/scripts/generate.js` — CLI_SCRIPT_PATH + dotenv usage string
- `skills/generating-voiceover/scripts/chatterbox_tts.js` — dotenv usage string (inline, no CLI_SCRIPT_PATH)
- `skills/extracting-foreground/scripts/extract.js` — inline usage string

**SKILL.md files with `name:` fields and/or internal path references to update:**
All 15 renamed skills' SKILL.md files need `name:` updated. Additionally:
- `skills/compiling-video/SKILL.md` — path references to old names
- `skills/upscaling-video/SKILL.md` — path references to old names
- `skills/aligning-lyrics/SKILL.md` — path references to old names
- `skills/breaking-down-video-script/SKILL.md` — path references to old names
- `skills/extracting-video-entities/SKILL.md` — path references to old names
- `skills/enriching-shot-details/SKILL.md` — path references to old names
- `skills/checking-consistency/SKILL.md` — path references to old names
- `skills/generating-thumbnail/SKILL.md` — path references to old names
- `skills/generating-seedance15-video/SKILL.md` — path references to old names
- `skills/writing-video-plan/SKILL.md` — path references to old names
- `skills/writing-seedance15-prompt/SKILL.md` — path references to old names
- `skills/extracting-foreground/SKILL.md` — path references to old names
- `skills/downloading-youtube-video/SKILL.md` — path references to old names

**Production pipeline references file:**
- `skills/running-production-pipeline/references/workflow.md` — all 4 skill name references + dotenv strings

**Docs files with old skill name references:**
- `docs/design.md`
- `docs/installation.md`
- `docs/testing.md`
- `docs/design-docs/2026-03-27-production-pipeline-design.md`

**Utility/pack SKILL.md files with dotenv usage strings only (not renamed):**
- `skills/generating-actor-pack/SKILL.md`
- `skills/generating-character-pack/SKILL.md`
- `skills/generating-costume-pack/SKILL.md`
- `skills/generating-prop-pack/SKILL.md`
- `skills/generating-scene-pack/SKILL.md`
- `skills/prompt-template/SKILL.md`

---

### Task 1: Rename all 15 skill directories

**Files:** All 15 directories listed in the File Map above.

- [ ] **Step 1: Run all renames**

```bash
cd /path/to/violyra  # replace with actual repo root
git mv skills/generate-voiceover skills/generating-voiceover
git mv skills/lyrics-force-alignment skills/aligning-lyrics
git mv skills/mv-storyboard-writer skills/writing-video-plan
git mv skills/script-breakdown skills/breaking-down-video-script
git mv skills/entity-extraction skills/extracting-video-entities
git mv skills/shot-detail skills/enriching-shot-details
git mv skills/mv-compilation skills/compiling-video
git mv skills/upscale-video skills/upscaling-video
git mv skills/download-youtube-video skills/downloading-youtube-video
git mv skills/extract-foreground skills/extracting-foreground
git mv skills/generate-thumbnail skills/generating-thumbnail
git mv skills/consistency-check skills/checking-consistency
git mv skills/production-pipeline skills/running-production-pipeline
git mv skills/seedance15-generate skills/generating-seedance15-video
git mv skills/seedance15-prompt-writer skills/writing-seedance15-prompt
```

- [ ] **Step 2: Verify renames**

```bash
ls skills/ | sort
```

Expected output includes: `aligning-lyrics`, `breaking-down-video-script`, `checking-consistency`, `compiling-video`, `downloading-youtube-video`, `enriching-shot-details`, `extracting-foreground`, `extracting-video-entities`, `generating-seedance15-video`, `generating-thumbnail`, `generating-voiceover`, `running-production-pipeline`, `upscaling-video`, `writing-seedance15-prompt`, `writing-video-plan`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: rename skill directories to gerund-object convention"
```

---

### Task 2: Update SKILL.md `name:` frontmatter for all renamed skills

**Files:** `skills/<new-name>/SKILL.md` for all 15 renamed skills.

- [ ] **Step 1: Update each `name:` field**

In each file, change the `name:` frontmatter to match the new directory name:

`skills/generating-voiceover/SKILL.md`: `name: generating-voiceover`
`skills/aligning-lyrics/SKILL.md`: `name: aligning-lyrics`
`skills/writing-video-plan/SKILL.md`: `name: writing-video-plan`
`skills/breaking-down-video-script/SKILL.md`: `name: breaking-down-video-script`
`skills/extracting-video-entities/SKILL.md`: `name: extracting-video-entities`
`skills/enriching-shot-details/SKILL.md`: `name: enriching-shot-details`
`skills/compiling-video/SKILL.md`: `name: compiling-video`
`skills/upscaling-video/SKILL.md`: `name: upscaling-video`
`skills/downloading-youtube-video/SKILL.md`: `name: downloading-youtube-video`
`skills/extracting-foreground/SKILL.md`: `name: extracting-foreground`
`skills/generating-thumbnail/SKILL.md`: `name: generating-thumbnail`
`skills/checking-consistency/SKILL.md`: `name: checking-consistency`
`skills/running-production-pipeline/SKILL.md`: `name: running-production-pipeline`
`skills/generating-seedance15-video/SKILL.md`: `name: generating-seedance15-video`
`skills/writing-seedance15-prompt/SKILL.md`: `name: writing-seedance15-prompt`

- [ ] **Step 2: Commit**

```bash
git add skills/generating-voiceover/SKILL.md skills/aligning-lyrics/SKILL.md \
  skills/writing-video-plan/SKILL.md skills/breaking-down-video-script/SKILL.md \
  skills/extracting-video-entities/SKILL.md skills/enriching-shot-details/SKILL.md \
  skills/compiling-video/SKILL.md skills/upscaling-video/SKILL.md \
  skills/downloading-youtube-video/SKILL.md skills/extracting-foreground/SKILL.md \
  skills/generating-thumbnail/SKILL.md skills/checking-consistency/SKILL.md \
  skills/running-production-pipeline/SKILL.md skills/generating-seedance15-video/SKILL.md \
  skills/writing-seedance15-prompt/SKILL.md
git commit -m "refactor: update SKILL.md name fields to match new directory names"
```

---

### Task 3: Update CLI_SCRIPT_PATH and dotenv usage strings in scripts

**Files:**
- Modify: `skills/aligning-lyrics/scripts/align.js`
- Modify: `skills/upscaling-video/scripts/upscale.js`
- Modify: `skills/compiling-video/scripts/compile.js`
- Modify: `skills/generating-thumbnail/scripts/generate.js`
- Modify: `skills/generating-seedance15-video/scripts/generate.js`
- Modify: `skills/generating-voiceover/scripts/chatterbox_tts.js`
- Modify: `skills/extracting-foreground/scripts/extract.js`

- [ ] **Step 1: Update `skills/aligning-lyrics/scripts/align.js`**

Change line 9:
```js
const CLI_SCRIPT_PATH = ".agents/skills/aligning-lyrics/scripts/align.js";
```

Change line 68 (inside usage string):
```
source .env && node ${CLI_SCRIPT_PATH} --audio <song.mp3> --lyrics <lyrics.txt> [--json] [--srt] [--lrc]
```

- [ ] **Step 2: Update `skills/upscaling-video/scripts/upscale.js`**

Change `CLI_SCRIPT_PATH`:
```js
const CLI_SCRIPT_PATH = ".agents/skills/upscaling-video/scripts/upscale.js";
```

Change dotenv usage string:
```
source .env && node ${CLI_SCRIPT_PATH} --input <video.mp4> [--output <upscaled.mp4>] [--target-resolution <720p|1080p|4k>] [--target-fps <15-120>] [--poll-interval-ms <ms>]
```

- [ ] **Step 3: Update `skills/compiling-video/scripts/compile.js`**

Change `CLI_SCRIPT_PATH`:
```js
const CLI_SCRIPT_PATH = ".agents/skills/compiling-video/scripts/compile.js";
```

Change dotenv usage string:
```
source .env && node ${CLI_SCRIPT_PATH} [options]
```

- [ ] **Step 4: Update `skills/generating-thumbnail/scripts/generate.js`**

Change `CLI_SCRIPT_PATH`:
```js
const CLI_SCRIPT_PATH = ".agents/skills/generating-thumbnail/scripts/generate.js";
```

Change dotenv usage string:
```
source .env && node ${CLI_SCRIPT_PATH} --prompt "<text>" --output <path> [--image <path-or-url>] [--aspect-ratio <value>] [--resolution <value>] [--output-format <jpg|png>] [--safety-filter-level <value>] [--allow-fallback-model] [--poll-interval-ms <ms>]
```

- [ ] **Step 5: Update `skills/generating-seedance15-video/scripts/generate.js`**

Change `CLI_SCRIPT_PATH`:
```js
const CLI_SCRIPT_PATH = ".agents/skills/generating-seedance15-video/scripts/generate.js";
```

Change dotenv usage string:
```
source .env && node ${CLI_SCRIPT_PATH} [--input <storyboard-json>] [--output <manifest-json>] [--scenes-dir <dir>] [--scene-id <id>] [--duration <seconds>] [--resolution <value>] [--aspect-ratio <value>] [--fps <value>] [--generate-audio] [--image <uri>] [--poll-interval-ms <ms>]
```

- [ ] **Step 6: Update `skills/generating-voiceover/scripts/chatterbox_tts.js`**

Change the inline usage string (no CLI_SCRIPT_PATH in this file). Find the current usage block:
```
REPLICATE_API_TOKEN=<token> node .agent/skills/text-to-speech/scripts/chatterbox_tts.js ...
```
Replace with:
```
source .env && node .agents/skills/generating-voiceover/scripts/chatterbox_tts.js --prompt "<text>" --output <output-audio-path> [--audio-ref <reference-audio-path>] [--poll-interval-ms <ms>]
```

- [ ] **Step 7: Update `skills/extracting-foreground/scripts/extract.js`**

Find the inline usage comment:
```
node .agent/skills/transparent-image/scripts/extract.js --input public/bicycle.png --output public/bicycle-transparent.png
```
Replace with:
```
node .agents/skills/extracting-foreground/scripts/extract.js --input public/bicycle.png --output public/bicycle-transparent.png
```

- [ ] **Step 8: Commit**

```bash
git add skills/aligning-lyrics/scripts/align.js \
  skills/upscaling-video/scripts/upscale.js \
  skills/compiling-video/scripts/compile.js \
  skills/generating-thumbnail/scripts/generate.js \
  skills/generating-seedance15-video/scripts/generate.js \
  skills/generating-voiceover/scripts/chatterbox_tts.js \
  skills/extracting-foreground/scripts/extract.js
git commit -m "refactor: update CLI_SCRIPT_PATH and replace dotenv usage strings in scripts"
```

---

### Task 4: Fix cross-skill import in compiling-video

**Files:**
- Modify: `skills/compiling-video/scripts/compile.js:11`

- [ ] **Step 1: Update the import path**

Change line 11:
```js
import { upscaleVideo, parseTargetResolution } from "../../upscaling-video/scripts/upscale.js";
```

- [ ] **Step 2: Commit**

```bash
git add skills/compiling-video/scripts/compile.js
git commit -m "fix: update cross-skill import path after upscale-video → upscaling-video rename"
```

---

### Task 5: Update SKILL.md path references for renamed skills

**Files:** SKILL.md files that contain inline path references (skill paths in example commands, `source` lines, validation commands).

- [ ] **Step 1: Update `skills/compiling-video/SKILL.md`**

Replace all occurrences of:
- `.agents/skills/mv-compilation/` → `.agents/skills/compiling-video/`
- `.agents/skills/upscale-video/` → `.agents/skills/upscaling-video/`
- `pnpm exec dotenv -- ` → `source .env && `

- [ ] **Step 2: Update `skills/upscaling-video/SKILL.md`**

Replace:
- `.agents/skills/upscale-video/` → `.agents/skills/upscaling-video/`
- `.agents/skills/mv-compilation/` → `.agents/skills/compiling-video/`
- `pnpm exec dotenv -- ` → `source .env && `

- [ ] **Step 3: Update `skills/aligning-lyrics/SKILL.md`**

Replace:
- `.agents/skills/lyrics-force-alignment/` → `.agents/skills/aligning-lyrics/`
- `pnpm exec dotenv -- ` → `source .env && `

- [ ] **Step 4: Update `skills/breaking-down-video-script/SKILL.md`**

Replace:
- `skills/script-breakdown/` → `skills/breaking-down-video-script/`
- `pnpm exec dotenv -- ` → `source .env && `

- [ ] **Step 5: Update `skills/extracting-video-entities/SKILL.md`**

Replace:
- `skills/entity-extraction/` → `skills/extracting-video-entities/`
- `pnpm exec dotenv -- ` → `source .env && `

- [ ] **Step 6: Update `skills/enriching-shot-details/SKILL.md`**

Replace:
- `skills/shot-detail/` → `skills/enriching-shot-details/`
- `pnpm exec dotenv -- ` → `source .env && `

- [ ] **Step 7: Update `skills/checking-consistency/SKILL.md`**

Replace:
- `skills/consistency-check/` → `skills/checking-consistency/`
- `pnpm exec dotenv -- ` → `source .env && `

- [ ] **Step 8: Update `skills/generating-thumbnail/SKILL.md`**

Replace:
- `.agents/skills/generate-thumbnail/` → `.agents/skills/generating-thumbnail/`
- `pnpm exec dotenv -- ` → `source .env && `

- [ ] **Step 9: Update `skills/generating-seedance15-video/SKILL.md`**

Replace:
- `.agents/skills/seedance15-generate/` → `.agents/skills/generating-seedance15-video/`
- `pnpm exec dotenv -- ` → `source .env && `

- [ ] **Step 10: Update `skills/writing-video-plan/SKILL.md`**

Replace any path references to `mv-storyboard-writer` → `writing-video-plan`.

- [ ] **Step 11: Update `skills/writing-seedance15-prompt/SKILL.md`**

Replace any path references to `seedance15-prompt-writer` → `writing-seedance15-prompt`.

- [ ] **Step 12: Update `skills/extracting-foreground/SKILL.md`**

Replace any path references to `extract-foreground` → `extracting-foreground`.

- [ ] **Step 13: Update `skills/downloading-youtube-video/SKILL.md`**

Replace any path references to `download-youtube-video` → `downloading-youtube-video`.

- [ ] **Step 14: Update `skills/generating-voiceover/SKILL.md`**

Replace any path references to `generate-voiceover` → `generating-voiceover`.

- [ ] **Step 15: Commit**

```bash
git add skills/compiling-video/SKILL.md skills/upscaling-video/SKILL.md \
  skills/aligning-lyrics/SKILL.md skills/breaking-down-video-script/SKILL.md \
  skills/extracting-video-entities/SKILL.md skills/enriching-shot-details/SKILL.md \
  skills/checking-consistency/SKILL.md skills/generating-thumbnail/SKILL.md \
  skills/generating-seedance15-video/SKILL.md skills/writing-video-plan/SKILL.md \
  skills/writing-seedance15-prompt/SKILL.md skills/extracting-foreground/SKILL.md \
  skills/downloading-youtube-video/SKILL.md skills/generating-voiceover/SKILL.md
git commit -m "refactor: update SKILL.md path references to new skill directory names"
```

---

### Task 6: Update running-production-pipeline references

**Files:**
- Modify: `skills/running-production-pipeline/SKILL.md`
- Modify: `skills/running-production-pipeline/references/workflow.md`

- [ ] **Step 1: Update `skills/running-production-pipeline/SKILL.md`**

Replace:
- `script-breakdown → entity-extraction → shot-detail → consistency-check` → `breaking-down-video-script → extracting-video-entities → enriching-shot-details → checking-consistency`
- `skills/production-pipeline/references/workflow.md` → `skills/running-production-pipeline/references/workflow.md`

- [ ] **Step 2: Update `skills/running-production-pipeline/references/workflow.md`**

Replace all occurrences:
- `script-breakdown` → `breaking-down-video-script`
- `entity-extraction` → `extracting-video-entities`
- `shot-detail` → `enriching-shot-details`
- `consistency-check` → `checking-consistency`
- `pnpm exec dotenv -- node skills/` → `source .env && node skills/`

- [ ] **Step 3: Commit**

```bash
git add skills/running-production-pipeline/SKILL.md \
  skills/running-production-pipeline/references/workflow.md
git commit -m "refactor: update production-pipeline skill name references and dotenv usage strings"
```

---

### Task 7: Update dotenv usage strings in utility/pack SKILL.md files

**Files:**
- Modify: `skills/generating-actor-pack/SKILL.md`
- Modify: `skills/generating-character-pack/SKILL.md`
- Modify: `skills/generating-costume-pack/SKILL.md`
- Modify: `skills/generating-prop-pack/SKILL.md`
- Modify: `skills/generating-scene-pack/SKILL.md`
- Modify: `skills/prompt-template/SKILL.md`

- [ ] **Step 1: Replace `pnpm exec dotenv -- ` with `source .env && ` in each file**

In each of the 6 files, replace every occurrence of:
```
pnpm exec dotenv --
```
with:
```
source .env &&
```

- [ ] **Step 2: Commit**

```bash
git add skills/generating-actor-pack/SKILL.md \
  skills/generating-character-pack/SKILL.md \
  skills/generating-costume-pack/SKILL.md \
  skills/generating-prop-pack/SKILL.md \
  skills/generating-scene-pack/SKILL.md \
  skills/prompt-template/SKILL.md
git commit -m "refactor: replace dotenv usage strings in utility and pack skill SKILL.md files"
```

---

### Task 8: Update docs

**Files:**
- Modify: `docs/design.md`
- Modify: `docs/installation.md`
- Modify: `docs/testing.md`
- Modify: `docs/design-docs/2026-03-27-production-pipeline-design.md`

- [ ] **Step 1: Update `docs/design.md`**

Replace all old skill names with new names in the skills table and the workflow diagram:
- `lyrics-force-alignment` → `aligning-lyrics`
- `generate-voiceover` → `generating-voiceover`
- `script-breakdown` → `breaking-down-video-script`
- `entity-extraction` → `extracting-video-entities`
- `shot-detail` → `enriching-shot-details`
- `consistency-check` → `checking-consistency`
- `production-pipeline` → `running-production-pipeline`
- `mv-storyboard-writer` → `writing-video-plan`
- `seedance15-prompt-writer` → `writing-seedance15-prompt`
- `seedance15-generate` → `generating-seedance15-video`
- `upscale-video` → `upscaling-video`
- `extract-foreground` → `extracting-foreground`
- `generate-thumbnail` → `generating-thumbnail`
- `mv-compilation` → `compiling-video`
- `download-youtube-video` → `downloading-youtube-video`

Also update the workflow diagram lines (lines 119-136) to use new names.

- [ ] **Step 2: Update `docs/installation.md`**

Replace old skill names in the skills table and any link paths:
- `seedance15-generate` → `generating-seedance15-video` (path and display)
- `seedance15-prompt-writer` → `writing-seedance15-prompt` (path and display)
- `mv-storyboard-writer` → `writing-video-plan` (path and display)
- `mv-compilation` → `compiling-video` (path and display)
- `lyrics-force-alignment` → `aligning-lyrics` (path and display)
- `download-youtube-video` → `downloading-youtube-video` (path and display)

- [ ] **Step 3: Update `docs/testing.md`**

Replace:
```
pnpm exec vitest run skills/mv-compilation
pnpm exec vitest run skills/lyrics-force-alignment
```
with:
```
pnpm exec vitest run skills/compiling-video
pnpm exec vitest run skills/aligning-lyrics
```

- [ ] **Step 4: Update `docs/design-docs/2026-03-27-production-pipeline-design.md`**

Replace all old skill names in that file with new names (same substitution list as Step 1).

- [ ] **Step 5: Commit**

```bash
git add docs/design.md docs/installation.md docs/testing.md \
  docs/design-docs/2026-03-27-production-pipeline-design.md
git commit -m "docs: update skill name references to new gerund-object convention"
```

---

### Task 9: Run full test suite and verify

**Files:** No changes — verification only.

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```

Expected:
```
Test Files  18 passed (18)
     Tests  173 passed (173)
```

If any test fails, check that:
1. No import paths in test files reference old directory names (they shouldn't — test files were unchanged by design)
2. The cross-skill import in `skills/compiling-video/scripts/compile.js` correctly points to `../../upscaling-video/scripts/upscale.js`

- [ ] **Step 2: Push branch**

```bash
git push -u origin feature/refactor-skill-naming
```
