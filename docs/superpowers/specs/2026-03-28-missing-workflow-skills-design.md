---
title: Missing Workflow, Music Production, and Full Pipeline Skills
date: 2026-03-28
status: approved
---

# Missing Workflow, Music Production, and Full Pipeline Skills

## Goal

Implement 9 skills referenced in `docs/design.md` and the typical workflow diagrams but not yet built. These close the gap between the current production pipeline layer (Phase A) and a fully guided end-to-end video production experience for both humans and AI agents.

## Skills Overview

| Skill | Category | Source | Scripts? |
|---|---|---|---|
| `brainstorming-video-idea` | Workflow | adapts `superpowers:brainstorming` | No |
| `setup-video-project` | Workflow | new | No |
| `executing-video-plan` | Workflow | adapts `superpowers:executing-plans` | No |
| `retention-driven-development` | Workflow | new | `validate-retention-report.js` validator |
| `requesting-video-review` | Workflow | adapts `superpowers:requesting-code-review` | No |
| `generating-lyrics` | Music Production | new | No |
| `generating-song` | Music Production | new | `validate-song.js` |
| `mv-production-pipeline` | Full Pipeline | new | No |
| `shorts-production-pipeline` | Full Pipeline | new | No |

---

## Section 1: Workflow Skills

### `brainstorming-video-idea`

**When to use:** Before making any video. Refines rough ideas through dialogue, explores alternatives, produces a design doc and seeds `project.json`.

**Adapts:** `superpowers:brainstorming` — same dialogue-driven structure, domain-specific questions and outputs.

**Workflow:**
1. Check existing context: any lyrics/screenplay provided, style references, prior `project.json`
2. Ask clarifying questions one at a time: genre/mood, characters, visual style, target platform (YouTube, TikTok, etc.), target duration
3. Propose 2–3 approaches to the visual concept with trade-offs
4. Present design in sections, get approval after each
5. Write design doc to `<base-dir>/docs/video-idea.md` — concept, style description, character list, chapter breakdown, seed values
6. Transition to `setup-video-project`

**Output:** `<base-dir>/docs/video-idea.md`

**Key difference from `superpowers:brainstorming`:** Output is a visual concept + character list, not a software architecture. Feeds directly into `project.json` initialization.

**No scripts.** Pure agent instructions.

---

### `setup-video-project`

**When to use:** After design approval from `brainstorming-video-idea`. Creates the isolated workspace and initializes `project.json`.

**No superpowers equivalent.** Mechanical, not creative.

**Workflow:**
1. Create directory structure:
   ```
   <base-dir>/
   ├── project.json
   ├── global/              ← actor/scene/prop/costume packs
   ├── characters/          ← character packs
   └── chapters/            ← one subdir per chapter
   ```
2. Write `project.json` with fields: `seed`, `style`, `defaultModel`, `fps`, `resolution`, `createdAt`
3. Confirm with user before overwriting if `project.json` already exists

**Output:** `<base-dir>/project.json`, directory structure

**No scripts.** Pure agent instructions. Agent writes `project.json` directly.

---

### `executing-video-plan`

**When to use:** With a production plan in hand. Dispatches subagents per task with two-stage review.

**Adapts:** `superpowers:executing-plans` — same load → review → execute loop, video-domain tasks.

**Workflow:**
1. Load plan, review critically — raise questions before starting
2. For each task:
   a. Mark in-progress
   b. Execute steps exactly
   c. **Two-stage review:**
      - Stage 1 (spec compliance): does output match `shot-details.json`? correct file path, duration, resolution?
      - Stage 2 (visual quality): does the clip look right? agent reviews via file metadata and any available preview
   d. Mark completed
3. Scenes within a chapter can run in parallel; chapters must be sequential
4. Transition to `retention-driven-development`

**Stop immediately when:** missing dependency, generation fails, instruction unclear, verification fails repeatedly.

**No scripts.** Pure agent instructions.

---

### `retention-driven-development`

**When to use:** After all scenes are generated. Simulates audience behavior, scores retention, replaces weak scenes.

**No superpowers equivalent.** New concept specific to video production.

**Core principle:** Replace, don't patch. A weak scene is regenerated from scratch, not tweaked.

**Workflow:**
1. Read all scene clips + `shot-details.json` for the chapter
2. Simulate 100 viewers: for each shot, score attention retention (0–100) based on:
   - Visual variety (scene/angle changes across adjacent shots)
   - Pacing (shot duration vs. action density)
   - Character presence (protagonist on screen)
   - Lyric sync (visual action matches lyric moment)
3. Identify weak shots: score < threshold (default 60)
4. For each weak shot:
   - Re-run `writing-seedance15-prompt` with a note on why the shot was weak
   - Re-run `generating-seedance15-video`
   - Re-score the new clip
5. Repeat until all shots pass threshold OR a full pass produces no improvement
6. Write `<chapter-dir>/retention-report.json`
7. Validate:
   ```bash
   source .env && node skills/retention-driven-development/scripts/validate-retention-report.js \
     --file <chapter-dir>/retention-report.json
   ```

**Output:** `<chapter-dir>/retention-report.json`

**Scripts:**
- `validate-retention-report.js` — validates JSON schema (shotScores array, threshold, passCount, failCount, iterations)
- `validate-retention-report.__test__.js`

---

### `requesting-video-review`

**When to use:** Between major phases or after the full pipeline. Reviews progress against plan, blocks on critical issues.

**Adapts:** `superpowers:requesting-code-review` — same dispatcher pattern, video-domain review criteria.

**Workflow:**
1. Gather review context:
   - Production plan
   - `retention-report.json`
   - Shot-by-shot diff: planned vs. actual (file paths, durations, any regenerations)
2. Dispatch a reviewer subagent with this context
3. Reviewer classifies issues by severity:
   - **Critical** — missing scenes, broken audio sync, unresolved consistency issues → blocks delivery
   - **Important** — visual quality below bar, shot doesn't match shot-detail spec → fix before delivery
   - **Minor** — style drift, minor pacing issue → note for next version
4. Act on feedback:
   - Fix Critical immediately
   - Fix Important before proceeding
   - Log Minor for follow-up

**No scripts.** Pure agent instructions.

---

## Section 2: Music Production Skills

### `generating-lyrics`

**When to use:** To write or refine song lyrics for a music video before generating audio.

**Workflow:**
1. Gather inputs: topic/theme, mood, genre, language, target duration (minutes), optional reference lyrics
2. Draft lyrics with structural markers: `[Verse 1]`, `[Chorus]`, `[Bridge]`, etc.
3. Present one section at a time to user for feedback
4. Iterate until approved
5. Write to `<chapter-dir>/lyrics.txt`

**Output:** `<chapter-dir>/lyrics.txt`

**No scripts.** Pure creative agent work.

---

### `generating-song`

**When to use:** To generate AI audio from approved lyrics and a style description.

**Design decision:** Current music generation models (Suno, Udio, etc.) are not available on Replicate. This skill is model-agnostic and guides the user to generate externally, then validates the result. This matches the "no LLM in code" philosophy — the skill prepares the prompt and waits.

**Workflow:**
1. Read `<chapter-dir>/lyrics.txt`
2. Compose a generation prompt: lyrics + style description (genre, BPM, instrumentation, mood, optional reference audio URL)
3. Present the prompt to the user
4. User generates audio in Suno/Udio/etc. and saves to `<chapter-dir>/song.mp3`
5. Validate:
   ```bash
   source .env && node skills/generating-song/scripts/validate-song.js \
     --file <chapter-dir>/song.mp3
   ```
6. If valid, transition to `aligning-lyrics`

**Output:** `<chapter-dir>/song.mp3` (placed by user)

**Scripts:**
- `validate-song.js` — checks file exists, is valid audio, duration > 0
- `validate-song.__test__.js`

---

## Section 3: Full Pipeline Skills

### `mv-production-pipeline`

**When to use:** To run the complete music video workflow from lyrics to final compiled video.

**Workflow (with skip flags):**
```
generating-lyrics          (skip with --skip-lyrics if lyrics.txt exists)
  → generating-song        (skip with --skip-song if song.mp3 exists)
  → aligning-lyrics
  → writing-video-plan
  → running-video-production-pipeline   (per chapter)
  → writing-seedance15-prompt           (per shot)
  → generating-seedance15-video         (per shot)
  → upscaling-video                     (skip with --skip-upscale)
  → compiling-video
  → retention-driven-development
  → requesting-video-review
```

**Inputs:** `--base-dir <path>`, optional `--skip-lyrics`, `--skip-song`, `--skip-upscale`

**Checkpoints:** Pauses for user approval after each major phase:
- After lyrics approval
- After storyboard approval
- After generation complete (before retention loop)
- After review

**No scripts.** Pure orchestration SKILL.md.

---

### `shorts-production-pipeline`

**When to use:** To run the complete short drama workflow from screenplay to final assembly.

**Key differences from `mv-production-pipeline`:**
- No lyrics or song phase — screenplay is the primary input
- Video generation model is user-chosen (not hardcoded to Seedance 1.5)
- Chapter structure maps to scenes/acts, not song sections

**Workflow:**
```
brainstorming-video-idea   (skip with --skip-brainstorm if screenplay exists)
  → setup-video-project
  → running-video-production-pipeline   (per chapter/scene)
  → [video generation per shot, model specified by --model]
  → compiling-video
  → retention-driven-development
  → requesting-video-review
```

**Inputs:** `--base-dir <path>`, `--screenplay <path>`, optional `--model <replicate-model-id>`, `--skip-brainstorm`

**No scripts.** Pure orchestration SKILL.md.

---

## What Does NOT Change

- Existing skill names, scripts, and schemas from Phase A
- `lib/pack-utils.js` and pack script CLI contracts
- `running-video-production-pipeline` and its four sub-skills
- `writing-video-plan`, `writing-seedance15-prompt`, `generating-seedance15-video`, `compiling-video`

## File Map

**Create (SKILL.md only):**
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
- `SKILL.md` (plugin root) — add all 9 new skills to the index
- `docs/design.md` — update Skill Library tables to mark all skills as implemented
- `RELEASES.md` — add proper release notes
