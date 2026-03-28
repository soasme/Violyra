# Missing Workflow, Music Production, and Full Pipeline Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 9 skills — 5 workflow, 2 music production, 2 full pipeline — that close the gap between the Phase A production pipeline and a fully guided end-to-end video production experience.

**Architecture:** Tasks 1–7 are pure SKILL.md files (no scripts, no tests). Tasks 8–9 add SKILL.md + one validator script each (TDD with Vitest). Task 10 updates the plugin root, design docs, and RELEASES.md. Tasks 1–7 are independent and can be done in parallel. Tasks 8–9 are independent of each other. Task 10 must come last.

**Tech Stack:** Node.js 20+ ESM, `node:fs`, `node:util` (parseArgs), Vitest 3, pnpm

**Worktree:** `.worktrees/feature/missing-workflow-skills`

---

## File Map

**Create (SKILL.md only, no scripts):**
- `skills/brainstorming-video-idea/SKILL.md`
- `skills/setup-video-project/SKILL.md`
- `skills/executing-video-plan/SKILL.md`
- `skills/requesting-video-review/SKILL.md`
- `skills/generating-lyrics/SKILL.md`
- `skills/mv-production-pipeline/SKILL.md`
- `skills/shorts-production-pipeline/SKILL.md`

**Create (SKILL.md + scripts):**
- `skills/retention-driven-development/SKILL.md`
- `skills/retention-driven-development/scripts/validate-retention-report.js`
- `skills/retention-driven-development/scripts/validate-retention-report.__test__.js`
- `skills/generating-song/SKILL.md`
- `skills/generating-song/scripts/validate-song.js`
- `skills/generating-song/scripts/validate-song.__test__.js`

**Modify:**
- `SKILL.md` — add all 9 new skills to the index
- `docs/design.md` — all skills now implemented; no table changes needed (they're already listed correctly)
- `RELEASES.md` — replace placeholder with real release notes

---

## Task 1: brainstorming-video-idea skill

**Files:**
- Create: `skills/brainstorming-video-idea/SKILL.md`

- [ ] **Create the skill file**

```markdown
---
name: brainstorming-video-idea
description: Use before making any video. Refines rough ideas through questions, explores visual alternatives, produces a design doc and seeds project.json values.
---

# Brainstorming Video Idea

Helps turn a rough video idea into a fully formed design through natural collaborative dialogue. Covers concept, style, characters, chapter structure, and seed values for `project.json`.

## Checklist

1. Check existing context — any lyrics, screenplay, style references, prior `project.json`
2. Ask clarifying questions one at a time:
   - Genre and mood (e.g., cinematic, anime, lo-fi, dark fantasy)
   - Target platform and duration (YouTube MV, TikTok short, etc.)
   - Main characters — names, roles, visual traits
   - Visual style — color palette, camera style, era/setting
   - Chapter structure — how many chapters/scenes?
3. Propose 2–3 approaches to the visual concept with trade-offs
4. Present design in sections, get approval after each section
5. Write design doc to `<base-dir>/docs/video-idea.md`
6. Transition to `setup-video-project`

## Design Doc Format

Save to `<base-dir>/docs/video-idea.md`:

```
# Video Idea: <title>

## Concept
<2–3 sentence summary>

## Style
- Genre: <genre>
- Mood: <mood>
- Color palette: <palette>
- Camera style: <style>
- Era/setting: <setting>

## Characters
| Name | Role | Visual traits |
|---|---|---|
| ... | ... | ... |

## Chapter Breakdown
| Chapter | Title | Raw text summary |
|---|---|---|
| 1 | ... | ... |

## Project Seeds
- seed: <integer>
- style: "<style description>"
- defaultModel: "bytedance/seedance-1.5-pro"
- fps: 24
- resolution: "1920x1080"
```

## Output

- `<base-dir>/docs/video-idea.md`

## After Approval

Transition to `setup-video-project` with the approved design.
```

- [ ] **Verify file exists and frontmatter is valid**

```bash
head -5 skills/brainstorming-video-idea/SKILL.md
```

Expected: `---`, `name: brainstorming-video-idea`, `description: ...`

- [ ] **Commit**

```bash
git add skills/brainstorming-video-idea/SKILL.md
git commit -m "feat: add brainstorming-video-idea skill"
```

---

## Task 2: setup-video-project skill

**Files:**
- Create: `skills/setup-video-project/SKILL.md`

- [ ] **Create the skill file**

```markdown
---
name: setup-video-project
description: Use after design approval from brainstorming-video-idea. Creates workspace directory structure and initializes project.json with seed, style, and model defaults.
---

# Setup Video Project

Creates the isolated workspace for a new video production after design approval.

## Inputs

- `--base-dir <path>` — project root to create
- Approved design doc at `<base-dir>/docs/video-idea.md` (or values provided directly)

## Workflow

1. If `<base-dir>/project.json` already exists, confirm with user before overwriting.
2. Create directory structure:
   ```
   <base-dir>/
   ├── docs/
   │   └── video-idea.md    (already exists from brainstorming)
   ├── global/              ← actor/scene/prop/costume packs
   ├── characters/          ← character packs
   └── chapters/            ← one subdir per chapter
   ```
3. Write `<base-dir>/project.json`:
   ```json
   {
     "$schemaVersion": "1.0",
     "title": "<video title>",
     "seed": <integer from design>,
     "style": "<style description from design>",
     "defaultModel": "bytedance/seedance-1.5-pro",
     "fps": 24,
     "resolution": "1920x1080",
     "createdAt": "<ISO timestamp>"
   }
   ```
4. Confirm workspace is ready.

## Output

- `<base-dir>/project.json`
- `<base-dir>/global/`, `<base-dir>/characters/`, `<base-dir>/chapters/` (empty directories)

## After Setup

Transition to `writing-plans` for the full production breakdown.
```

- [ ] **Verify file exists and frontmatter is valid**

```bash
head -5 skills/setup-video-project/SKILL.md
```

Expected: `---`, `name: setup-video-project`, `description: ...`

- [ ] **Commit**

```bash
git add skills/setup-video-project/SKILL.md
git commit -m "feat: add setup-video-project skill"
```

---

## Task 3: executing-video-plan skill

**Files:**
- Create: `skills/executing-video-plan/SKILL.md`

- [ ] **Create the skill file**

```markdown
---
name: executing-video-plan
description: Use when executing a video production plan task-by-task. Dispatches subagents per task with two-stage review: spec compliance then visual quality.
---

# Executing Video Plan

Loads a production plan, reviews it critically, then executes tasks with two-stage review per task.

## Inputs

- A written production plan (from `writing-plans`)
- `--base-dir <path>` — project root

## Workflow

### Step 1: Load and Review Plan

1. Read the plan file
2. Review critically — identify questions or concerns
3. If concerns: raise with user before starting
4. If no concerns: proceed

### Step 2: Execute Tasks

For each task:
1. Mark in-progress
2. Execute steps exactly as written
3. Two-stage review:
   - **Stage 1 — Spec compliance:** Does output match `shot-details.json`? Correct file path, duration, resolution?
   - **Stage 2 — Visual quality:** Does the clip look right? Review file metadata and any available preview.
4. Mark completed

**Parallelism:** Scenes within a chapter can run in parallel. Chapters must be sequential.

### Step 3: Complete

After all tasks complete and verified, transition to `retention-driven-development`.

## When to Stop

Stop immediately and ask the user when:
- Missing dependency (pack file, chapter file, audio)
- Generation fails after retry
- Instruction in plan is unclear
- Verification fails repeatedly

## After Execution

Transition to `retention-driven-development`.
```

- [ ] **Verify file exists and frontmatter is valid**

```bash
head -5 skills/executing-video-plan/SKILL.md
```

Expected: `---`, `name: executing-video-plan`, `description: ...`

- [ ] **Commit**

```bash
git add skills/executing-video-plan/SKILL.md
git commit -m "feat: add executing-video-plan skill"
```

---

## Task 4: requesting-video-review skill

**Files:**
- Create: `skills/requesting-video-review/SKILL.md`

- [ ] **Create the skill file**

```markdown
---
name: requesting-video-review
description: Use between major production phases or after the full pipeline. Reviews progress against plan by severity: Critical blocks delivery, Important blocks next phase, Minor is logged.
---

# Requesting Video Review

Dispatches a reviewer subagent with production context to catch issues before they cascade.

## When to Request

- After each major phase (storyboard, generation, post-production)
- Before final delivery
- When stuck — fresh perspective helps

## How to Request

1. Gather review context:
   - Production plan
   - `<chapter-dir>/retention-report.json`
   - Shot-by-shot diff: planned vs. actual file paths, durations, any regenerated shots
2. Dispatch a reviewer subagent with this context
3. Reviewer classifies issues by severity:
   - **Critical** — missing scenes, broken audio sync, unresolved consistency issues → blocks delivery
   - **Important** — visual quality below bar, shot doesn't match shot-detail spec → fix before next phase
   - **Minor** — style drift, minor pacing issue → log for next version
4. Act on feedback:
   - Fix Critical immediately before proceeding
   - Fix Important before delivering
   - Log Minor in `<base-dir>/docs/review-notes.md`
```

- [ ] **Verify file exists and frontmatter is valid**

```bash
head -5 skills/requesting-video-review/SKILL.md
```

Expected: `---`, `name: requesting-video-review`, `description: ...`

- [ ] **Commit**

```bash
git add skills/requesting-video-review/SKILL.md
git commit -m "feat: add requesting-video-review skill"
```

---

## Task 5: generating-lyrics skill

**Files:**
- Create: `skills/generating-lyrics/SKILL.md`

- [ ] **Create the skill file**

```markdown
---
name: generating-lyrics
description: Use when writing or refining song lyrics for a music video. Produces lyrics.txt with verse/chorus/bridge markers before audio generation.
---

# Generating Lyrics

Writes or refines song lyrics through collaborative dialogue. Output is `lyrics.txt` with structural markers for downstream audio alignment.

## Inputs

- Topic/theme
- Mood and genre
- Language
- Target duration (minutes)
- Optional: reference lyrics or existing draft at `<chapter-dir>/lyrics.txt`

## Workflow

1. Gather inputs from user (or infer from `<base-dir>/docs/video-idea.md`)
2. Draft lyrics section by section: `[Verse 1]`, `[Chorus]`, `[Verse 2]`, `[Bridge]`, etc.
3. Present one section at a time to user for feedback
4. Iterate until each section is approved
5. Write final lyrics to `<chapter-dir>/lyrics.txt` with structural markers

## Output Format

```
[Verse 1]
<line 1>
<line 2>
...

[Chorus]
<line 1>
...

[Bridge]
...
```

## Output

- `<chapter-dir>/lyrics.txt`

## After Approval

Transition to `generating-song`.
```

- [ ] **Verify file exists and frontmatter is valid**

```bash
head -5 skills/generating-lyrics/SKILL.md
```

Expected: `---`, `name: generating-lyrics`, `description: ...`

- [ ] **Commit**

```bash
git add skills/generating-lyrics/SKILL.md
git commit -m "feat: add generating-lyrics skill"
```

---

## Task 6: mv-production-pipeline skill

**Files:**
- Create: `skills/mv-production-pipeline/SKILL.md`

- [ ] **Create the skill file**

```markdown
---
name: mv-production-pipeline
description: Use to run the complete music video workflow from lyrics to final compiled video. Orchestrates all MV skills in sequence with user checkpoints between major phases.
---

# Music Video Production Pipeline

Top-level orchestrator for a complete music video production. Runs all skills in sequence with user approval checkpoints between major phases.

## Inputs

- `--base-dir <path>` — project root
- Optional skip flags:
  - `--skip-lyrics` — skip if `<chapter-dir>/lyrics.txt` already exists
  - `--skip-song` — skip if `<chapter-dir>/song.mp3` already exists
  - `--skip-upscale` — skip upscaling step

## Workflow

```
[Phase 1: Music]
generating-lyrics          (skip with --skip-lyrics)
  → generating-song        (skip with --skip-song)
  → aligning-lyrics
                           ← CHECKPOINT: confirm before storyboard

[Phase 2: Storyboard & Breakdown]
  → writing-video-plan
  → running-video-production-pipeline   (per chapter)
                           ← CHECKPOINT: confirm before generation

[Phase 3: Video Generation]
  → writing-seedance15-prompt           (per shot)
  → generating-seedance15-video         (per shot)
  → upscaling-video                     (skip with --skip-upscale)
                           ← CHECKPOINT: confirm before post-production

[Phase 4: Post-Production]
  → compiling-video
  → retention-driven-development
  → requesting-video-review
```

## Checkpoints

Pause for user confirmation after each phase before proceeding. Show what was produced and ask: "Continue to [next phase]? (Y/N)"

## Error Handling

Stop and report at any skill failure. Show which skill failed and what files are available. Ask user whether to retry, skip, or abort.
```

- [ ] **Verify file exists and frontmatter is valid**

```bash
head -5 skills/mv-production-pipeline/SKILL.md
```

Expected: `---`, `name: mv-production-pipeline`, `description: ...`

- [ ] **Commit**

```bash
git add skills/mv-production-pipeline/SKILL.md
git commit -m "feat: add mv-production-pipeline skill"
```

---

## Task 7: shorts-production-pipeline skill

**Files:**
- Create: `skills/shorts-production-pipeline/SKILL.md`

- [ ] **Create the skill file**

```markdown
---
name: shorts-production-pipeline
description: Use to run the complete short drama workflow from screenplay to final assembly. No lyrics/song phase. Video generation model is user-chosen via --model.
---

# Short Drama Production Pipeline

Top-level orchestrator for a complete short drama production. No lyrics or song phase — screenplay is the primary input. Video generation model is user-chosen.

## Inputs

- `--base-dir <path>` — project root
- `--screenplay <path>` — screenplay or story brief file
- `--model <replicate-model-id>` — video generation model (default: `bytedance/seedance-1.5-pro`)
- Optional skip flags:
  - `--skip-brainstorm` — skip if screenplay already exists and project is set up

## Workflow

```
[Phase 1: Setup]
brainstorming-video-idea   (skip with --skip-brainstorm)
  → setup-video-project
                           ← CHECKPOINT: confirm before breakdown

[Phase 2: Breakdown]
  → running-video-production-pipeline   (per chapter/scene)
                           ← CHECKPOINT: confirm before generation

[Phase 3: Video Generation]
  → [video generation per shot using --model]
                           ← CHECKPOINT: confirm before post-production

[Phase 4: Post-Production]
  → compiling-video
  → retention-driven-development
  → requesting-video-review
```

## Checkpoints

Pause for user confirmation after each phase before proceeding. Show what was produced and ask: "Continue to [next phase]? (Y/N)"

## Error Handling

Stop and report at any skill failure. Ask user whether to retry, skip, or abort.
```

- [ ] **Verify file exists and frontmatter is valid**

```bash
head -5 skills/shorts-production-pipeline/SKILL.md
```

Expected: `---`, `name: shorts-production-pipeline`, `description: ...`

- [ ] **Commit**

```bash
git add skills/shorts-production-pipeline/SKILL.md
git commit -m "feat: add shorts-production-pipeline skill"
```

---

## Task 8: retention-driven-development skill + validator

**Files:**
- Create: `skills/retention-driven-development/SKILL.md`
- Create: `skills/retention-driven-development/scripts/validate-retention-report.js`
- Create: `skills/retention-driven-development/scripts/validate-retention-report.__test__.js`

**Schema for `retention-report.json`:**
```json
{
  "$schemaVersion": "1.0",
  "chapterId": "chap_abc",
  "generatedAt": "2026-03-28T00:00:00Z",
  "threshold": 60,
  "iterations": 2,
  "shotScores": [
    { "shotIndex": 1, "score": 75, "status": "pass", "regenerated": false },
    { "shotIndex": 2, "score": 45, "status": "fail", "regenerated": true }
  ],
  "passCount": 1,
  "failCount": 1
}
```

- [ ] **Write the failing test**

```javascript
// skills/retention-driven-development/scripts/validate-retention-report.__test__.js
import { it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/retention-driven-development/scripts/validate-retention-report.js'

function validate(data) {
  const f = join(tmpDir, 'report.json')
  writeFileSync(f, JSON.stringify(data), 'utf8')
  return spawnSync('node', [SCRIPT, '--file', f], { encoding: 'utf8' })
}

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'retention-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

const VALID_SHOT = { shotIndex: 1, score: 75, status: 'pass', regenerated: false }

const VALID = {
  $schemaVersion: '1.0',
  chapterId: 'chap_abc',
  generatedAt: '2026-03-28T00:00:00Z',
  threshold: 60,
  iterations: 2,
  shotScores: [VALID_SHOT],
  passCount: 1,
  failCount: 0,
}

it('accepts valid report', () => { expect(validate(VALID).status).toBe(0) })
it('rejects missing $schemaVersion', () => { const d = { ...VALID }; delete d.$schemaVersion; expect(validate(d).status).toBe(1) })
it('rejects unknown $schemaVersion', () => { expect(validate({ ...VALID, $schemaVersion: '2.0' }).status).toBe(1) })
it('rejects missing chapterId', () => { const d = { ...VALID }; delete d.chapterId; expect(validate(d).status).toBe(1) })
it('rejects non-number threshold', () => { expect(validate({ ...VALID, threshold: 'sixty' }).status).toBe(1) })
it('rejects non-number iterations', () => { expect(validate({ ...VALID, iterations: '2' }).status).toBe(1) })
it('rejects non-array shotScores', () => { expect(validate({ ...VALID, shotScores: {} }).status).toBe(1) })
it('rejects shot with non-number shotIndex', () => {
  expect(validate({ ...VALID, shotScores: [{ ...VALID_SHOT, shotIndex: 'one' }] }).status).toBe(1)
})
it('rejects shot with score out of range', () => {
  expect(validate({ ...VALID, shotScores: [{ ...VALID_SHOT, score: 150 }] }).status).toBe(1)
})
it('rejects shot with invalid status', () => {
  expect(validate({ ...VALID, shotScores: [{ ...VALID_SHOT, status: 'maybe' }] }).status).toBe(1)
})
it('rejects shot with non-boolean regenerated', () => {
  expect(validate({ ...VALID, shotScores: [{ ...VALID_SHOT, regenerated: 'yes' }] }).status).toBe(1)
})
it('rejects non-number passCount', () => { expect(validate({ ...VALID, passCount: '1' }).status).toBe(1) })
it('rejects non-number failCount', () => { expect(validate({ ...VALID, failCount: null }).status).toBe(1) })
it('exits 1 when --file missing', () => {
  expect(spawnSync('node', [SCRIPT], { encoding: 'utf8' }).status).toBe(1)
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm test skills/retention-driven-development
```

Expected: FAIL — script not found

- [ ] **Create the SKILL.md**

```markdown
---
name: retention-driven-development
description: Use after all scenes are generated. Simulates 100 viewers per shot, scores retention, regenerates weak shots (score < threshold). Replace, don't patch.
---

# Retention-Driven Development

Simulates audience behavior to identify and replace weak shots. Core principle: **replace, don't patch.**

## Inputs

- All scene clips for the chapter (file paths from `shot-details.json`)
- `<chapter-dir>/shot-details.json`
- `--chapter-dir <path>`
- `--threshold <integer>` — minimum passing score (default: 60)

## Workflow

1. Read all scene clips and `shot-details.json`
2. For each shot, score retention (0–100) based on:
   - **Visual variety** — scene/angle changes vs. adjacent shots
   - **Pacing** — shot duration vs. action density in the script excerpt
   - **Character presence** — protagonist on screen?
   - **Lyric sync** — does the visual action match the lyric moment?
3. Identify weak shots: score < threshold
4. For each weak shot:
   a. Note why the shot scored low
   b. Re-run `writing-seedance15-prompt` with the weakness note
   c. Re-run `generating-seedance15-video`
   d. Re-score the new clip
5. Repeat until all shots pass OR a full pass produces no improvement
6. Write `<chapter-dir>/retention-report.json`
7. Validate:
   ```bash
   source .env && node skills/retention-driven-development/scripts/validate-retention-report.js \
     --file <chapter-dir>/retention-report.json
   ```

## Output

- `<chapter-dir>/retention-report.json`

## Validation

```bash
source .env && node skills/retention-driven-development/scripts/validate-retention-report.js --file <path>
```

Exits 0 on valid, 1 on invalid (error to stderr).

## After Completion

Transition to `requesting-video-review`.
```

- [ ] **Write the validator script**

```javascript
// skills/retention-driven-development/scripts/validate-retention-report.js
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const SCHEMA_VERSION = '1.0'
const VALID_STATUSES = ['pass', 'fail']

function validate(data) {
  if (data.$schemaVersion === undefined) throw new Error('Missing $schemaVersion')
  if (data.$schemaVersion !== SCHEMA_VERSION) throw new Error(`Unknown $schemaVersion: ${data.$schemaVersion}`)
  if (!data.chapterId || typeof data.chapterId !== 'string') throw new Error('Missing chapterId')
  if (!data.generatedAt || typeof data.generatedAt !== 'string') throw new Error('Missing generatedAt')
  if (typeof data.threshold !== 'number') throw new Error('threshold must be a number')
  if (typeof data.iterations !== 'number') throw new Error('iterations must be a number')
  if (!Array.isArray(data.shotScores)) throw new Error('shotScores must be an array')
  for (const [i, shot] of data.shotScores.entries()) {
    if (typeof shot.shotIndex !== 'number') throw new Error(`shotScores[${i}].shotIndex must be a number`)
    if (typeof shot.score !== 'number' || shot.score < 0 || shot.score > 100)
      throw new Error(`shotScores[${i}].score must be a number between 0 and 100`)
    if (!VALID_STATUSES.includes(shot.status))
      throw new Error(`shotScores[${i}].status must be one of: ${VALID_STATUSES.join(', ')}`)
    if (typeof shot.regenerated !== 'boolean') throw new Error(`shotScores[${i}].regenerated must be a boolean`)
  }
  if (typeof data.passCount !== 'number') throw new Error('passCount must be a number')
  if (typeof data.failCount !== 'number') throw new Error('failCount must be a number')
}

function main() {
  const { values } = parseArgs({ args: process.argv.slice(2), options: { file: { type: 'string' } }, strict: false })
  if (!values.file) { process.stderr.write('Missing required flag: --file\n'); process.exit(1) }
  let data
  try { data = JSON.parse(readFileSync(values.file, 'utf8')) }
  catch (e) { process.stderr.write(`Failed to read file: ${e.message}\n`); process.exit(1) }
  try { validate(data); process.exit(0) }
  catch (e) { process.stderr.write(e.message + '\n'); process.exit(1) }
}

main()
```

- [ ] **Run tests to verify they pass**

```bash
pnpm test skills/retention-driven-development
```

Expected: 14 tests pass

- [ ] **Commit**

```bash
git add skills/retention-driven-development/
git commit -m "feat: add retention-driven-development skill with validator"
```

---

## Task 9: generating-song skill + validator

**Files:**
- Create: `skills/generating-song/SKILL.md`
- Create: `skills/generating-song/scripts/validate-song.js`
- Create: `skills/generating-song/scripts/validate-song.__test__.js`

`validate-song.js` checks: file exists, extension is a valid audio format (.mp3, .wav, .flac, .m4a, .ogg), file size > 0.

- [ ] **Write the failing test**

```javascript
// skills/generating-song/scripts/validate-song.__test__.js
import { it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/generating-song/scripts/validate-song.js'

function run(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' })
}

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'song-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

it('accepts a valid mp3 file', () => {
  const f = join(tmpDir, 'song.mp3')
  writeFileSync(f, 'fake audio content', 'utf8')
  expect(run(['--file', f]).status).toBe(0)
})
it('accepts wav extension', () => {
  const f = join(tmpDir, 'song.wav')
  writeFileSync(f, 'fake audio content', 'utf8')
  expect(run(['--file', f]).status).toBe(0)
})
it('accepts flac extension', () => {
  const f = join(tmpDir, 'song.flac')
  writeFileSync(f, 'fake audio content', 'utf8')
  expect(run(['--file', f]).status).toBe(0)
})
it('accepts m4a extension', () => {
  const f = join(tmpDir, 'song.m4a')
  writeFileSync(f, 'fake audio content', 'utf8')
  expect(run(['--file', f]).status).toBe(0)
})
it('accepts ogg extension', () => {
  const f = join(tmpDir, 'song.ogg')
  writeFileSync(f, 'fake audio content', 'utf8')
  expect(run(['--file', f]).status).toBe(0)
})
it('rejects file that does not exist', () => {
  expect(run(['--file', join(tmpDir, 'missing.mp3')]).status).toBe(1)
})
it('rejects unsupported extension', () => {
  const f = join(tmpDir, 'song.txt')
  writeFileSync(f, 'not audio', 'utf8')
  expect(run(['--file', f]).status).toBe(1)
})
it('rejects empty file', () => {
  const f = join(tmpDir, 'song.mp3')
  writeFileSync(f, '', 'utf8')
  expect(run(['--file', f]).status).toBe(1)
})
it('exits 1 when --file missing', () => {
  expect(run([]).status).toBe(1)
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm test skills/generating-song
```

Expected: FAIL — script not found

- [ ] **Create the SKILL.md**

```markdown
---
name: generating-song
description: Use to generate AI audio from approved lyrics and a style description. Prepares the generation prompt, waits for user to drop in the audio file, then validates it.
---

# Generating Song

Composes a generation prompt from lyrics and style, presents it to the user, then validates the audio file once the user places it.

Current music generation models (Suno, Udio, etc.) are not on Replicate. This skill is model-agnostic — the agent prepares the prompt and the user generates externally.

## Inputs

- `<chapter-dir>/lyrics.txt` — from `generating-lyrics`
- Style description (genre, BPM, instrumentation, mood)
- Optional: reference audio URL

## Workflow

1. Read `<chapter-dir>/lyrics.txt`
2. Compose generation prompt:
   ```
   Lyrics:
   <full lyrics text>

   Style: <genre>, <BPM> BPM, <instrumentation>, <mood>
   Reference: <URL if provided>
   ```
3. Present prompt to user
4. User generates audio in Suno, Udio, or another tool and saves to `<chapter-dir>/song.mp3`
5. Validate:
   ```bash
   source .env && node skills/generating-song/scripts/validate-song.js \
     --file <chapter-dir>/song.mp3
   ```
6. If valid, transition to `aligning-lyrics`

## Output

- `<chapter-dir>/song.mp3` (placed by user; validated by script)

## Validation

```bash
source .env && node skills/generating-song/scripts/validate-song.js --file <path>
```

Exits 0 if file exists, has a supported extension (.mp3 .wav .flac .m4a .ogg), and size > 0.
Exits 1 with error to stderr otherwise.

## After Validation

Transition to `aligning-lyrics`.
```

- [ ] **Write the validator script**

```javascript
// skills/generating-song/scripts/validate-song.js
import { statSync } from 'node:fs'
import { extname } from 'node:path'
import { parseArgs } from 'node:util'

const VALID_EXTENSIONS = new Set(['.mp3', '.wav', '.flac', '.m4a', '.ogg'])

function validate(filePath) {
  const ext = extname(filePath).toLowerCase()
  if (!VALID_EXTENSIONS.has(ext))
    throw new Error(`Unsupported extension: ${ext}. Expected one of: ${[...VALID_EXTENSIONS].join(', ')}`)
  let stat
  try { stat = statSync(filePath) }
  catch { throw new Error(`File not found: ${filePath}`) }
  if (stat.size === 0) throw new Error(`File is empty: ${filePath}`)
}

function main() {
  const { values } = parseArgs({ args: process.argv.slice(2), options: { file: { type: 'string' } }, strict: false })
  if (!values.file) { process.stderr.write('Missing required flag: --file\n'); process.exit(1) }
  try { validate(values.file); process.exit(0) }
  catch (e) { process.stderr.write(e.message + '\n'); process.exit(1) }
}

main()
```

- [ ] **Run tests to verify they pass**

```bash
pnpm test skills/generating-song
```

Expected: 9 tests pass

- [ ] **Commit**

```bash
git add skills/generating-song/
git commit -m "feat: add generating-song skill with validator"
```

---

## Task 10: Update plugin root, and RELEASES.md

**Files:**
- Modify: `SKILL.md`
- Modify: `RELEASES.md`

- [ ] **Update SKILL.md to add all 9 new skills**

Replace the `## Skills` section in `SKILL.md` with:

```markdown
## Skills

### Workflow
- [Brainstorming Video Idea](skills/brainstorming-video-idea/SKILL.md): refine a rough video idea through dialogue into a design doc and project.json seeds.
- [Setup Video Project](skills/setup-video-project/SKILL.md): create workspace directory structure and initialize project.json after design approval.
- [Executing Video Plan](skills/executing-video-plan/SKILL.md): execute a video production plan task-by-task with two-stage review per task.
- [Retention-Driven Development](skills/retention-driven-development/SKILL.md): simulate 100 viewers per shot, score retention, regenerate weak shots. Replace, don't patch.
- [Requesting Video Review](skills/requesting-video-review/SKILL.md): review production progress against plan by severity; Critical blocks delivery.

### Music Production
- [Generating Lyrics](skills/generating-lyrics/SKILL.md): write or refine song lyrics with verse/chorus/bridge markers before audio generation.
- [Generating Song](skills/generating-song/SKILL.md): compose a generation prompt from lyrics and style; validate the audio file once placed.

### Asset Management
- [Generating Actor Pack](skills/generating-actor-pack/SKILL.md): manage global actor appearance references (name, appearance text, reference images).
- [Generating Character Pack](skills/generating-character-pack/SKILL.md): manage project-scoped character compositions (actor + costume + props).
- [Generating Scene Pack](skills/generating-scene-pack/SKILL.md): manage global scene/environment references.
- [Generating Prop Pack](skills/generating-prop-pack/SKILL.md): manage global prop references.
- [Generating Costume Pack](skills/generating-costume-pack/SKILL.md): manage global costume references.
- [Prompt Template](skills/prompt-template/SKILL.md): manage reusable prompt templates with `{{variable}}` slots.

### Production Pipeline
- [Breaking Down Video Script](skills/breaking-down-video-script/SKILL.md): convert any raw text into an indexed shot list and chapter summary.
- [Extracting Video Entities](skills/extracting-video-entities/SKILL.md): populate actor, scene, prop, and costume packs from a shot list.
- [Enriching Shot Details](skills/enriching-shot-details/SKILL.md): enrich shots with cinematic parameters (framing, angle, movement, mood, frame prompts).
- [Checking Consistency](skills/checking-consistency/SKILL.md): detect character/scene drift across shots and produce a consistency report.
- [Running Video Production Pipeline](skills/running-video-production-pipeline/SKILL.md): orchestrate breaking-down → extracting → enriching → checking for a chapter.

### Video Generation
- [Writing Video Plan](skills/writing-video-plan/SKILL.md): write a lyric-driven storyboard from lyrics, style, and requirements.
- [Writing Seedance15 Prompt](skills/writing-seedance15-prompt/SKILL.md): write motion-focused Seedance prompts from shot details.
- [Generating Seedance15 Video](skills/generating-seedance15-video/SKILL.md): generate scene videos with Seedance 1.5 via Replicate.
- [Upscaling Video](skills/upscaling-video/SKILL.md): upscale scene clips with Topaz via Replicate.
- [Extracting Foreground](skills/extracting-foreground/SKILL.md): extract foreground objects from images and produce transparent PNG cutouts.
- [Generating Thumbnail](skills/generating-thumbnail/SKILL.md): generate video thumbnails via Replicate.

### Post-Production
- [Compiling Video](skills/compiling-video/SKILL.md): compile scene clips into a full music video with ffmpeg (stretch, fit, concat, audio mux).

### Full Pipeline
- [MV Production Pipeline](skills/mv-production-pipeline/SKILL.md): run the complete music video workflow from lyrics to final compiled video.
- [Shorts Production Pipeline](skills/shorts-production-pipeline/SKILL.md): run the complete short drama workflow from screenplay to final assembly.

### Utilities
- [Replicate](skills/replicate/SKILL.md): discover and run Replicate models through API-first workflow.
- [Downloading YouTube Video](skills/downloading-youtube-video/SKILL.md): download a YouTube URL to local files using `uvx yt-dlp`.
```

- [ ] **Verify SKILL.md has all 9 new skills listed**

```bash
grep -c "SKILL.md" SKILL.md
```

Expected: at least 29 (was 11, added 9 + reorganized sections)

- [ ] **Update RELEASES.md with real release notes**

Replace the entire file content with:

```markdown
# Releases

## v1.1.0 — 2026-03-28

### New Skills

**Workflow (5)**
- `brainstorming-video-idea` — dialogue-driven ideation to design doc and project.json seeds
- `setup-video-project` — workspace creation and project.json initialization
- `executing-video-plan` — task execution with two-stage review (spec compliance + visual quality)
- `retention-driven-development` — audience simulation loop; replace weak shots, never patch
- `requesting-video-review` — severity-classified review (Critical / Important / Minor)

**Music Production (2)**
- `generating-lyrics` — collaborative lyric writing with structural markers
- `generating-song` — generation prompt composer + audio file validator

**Full Pipeline (2)**
- `mv-production-pipeline` — complete music video orchestrator with phase checkpoints
- `shorts-production-pipeline` — complete short drama orchestrator, model-agnostic

### Changes
- All skills now follow `gerund-object` naming convention (15 skills renamed in v1.0.1)
- Plugin root `SKILL.md` reorganized into sections: Workflow, Music Production, Asset Management, Production Pipeline, Video Generation, Post-Production, Full Pipeline, Utilities

---

## v1.0.1 — 2026-03-28

### Changes
- Renamed 15 skills to `gerund-object` naming convention
- Replaced `pnpm exec dotenv --` with `source .env &&` in all usage strings

---

## v1.0.0 — 2026-03-28

### Features
- 6 pack management skills: `generating-actor-pack`, `generating-character-pack`, `generating-scene-pack`, `generating-prop-pack`, `generating-costume-pack`, `prompt-template`
- 4 production pipeline reasoning skills: `breaking-down-video-script`, `extracting-video-entities`, `enriching-shot-details`, `checking-consistency`
- `running-video-production-pipeline` orchestrator
- Video generation skills: `writing-video-plan`, `writing-seedance15-prompt`, `generating-seedance15-video`, `upscaling-video`, `extracting-foreground`, `generating-thumbnail`, `compiling-video`
- Audio skills: `aligning-lyrics`, `generating-voiceover`
- Utilities: `replicate`, `downloading-youtube-video`
- Shared `skills/lib/pack-utils.js` for JSON I/O across pack skills
- GitHub Actions CI with Vitest test suite (173 tests)
```

- [ ] **Run full test suite to confirm nothing broken**

```bash
pnpm test
```

Expected: all tests pass (173+)

- [ ] **Commit**

```bash
git add SKILL.md RELEASES.md
git commit -m "feat: update plugin root and RELEASES.md for v1.1.0"
```

---

## Self-Review

**Spec coverage:**
- `brainstorming-video-idea` → Task 1 ✓
- `setup-video-project` → Task 2 ✓
- `executing-video-plan` → Task 3 ✓
- `requesting-video-review` → Task 4 ✓
- `generating-lyrics` → Task 5 ✓
- `mv-production-pipeline` → Task 6 ✓
- `shorts-production-pipeline` → Task 7 ✓
- `retention-driven-development` (SKILL.md + validator) → Task 8 ✓
- `generating-song` (SKILL.md + validator) → Task 9 ✓
- Plugin root + RELEASES.md → Task 10 ✓

**Placeholder scan:** No TBDs. All SKILL.md content is complete. All script code is complete. All test code is complete.

**Type consistency:** Validator field names (`$schemaVersion`, `chapterId`, `threshold`, `iterations`, `shotScores`, `passCount`, `failCount`) match between test fixtures, validate function, and SKILL.md schema doc. `validate-song.js` uses `VALID_EXTENSIONS` set consistently across validate function and error message.
