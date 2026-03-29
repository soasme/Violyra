# Releases

## v1.3.0 — 2026-03-29

### Infrastructure

**Harness Engineering**
- `AGENTS.md` — golden principles for agents working on this repo (naming, test requirements, lint gate)
- `scripts/lint-skills.js` — deterministic linter: validates frontmatter, description length, name/directory match, gerund-object convention
- `.claude/settings.json` — pre-tool hook: runs `pnpm lint-skills` before any write to `skills/`
- `package.json` — new `lint-skills` script

**Observability**
- `skills/lib/logging-guide.md` — canonical JSONL schema for production logs
- All 33 existing `SKILL.md` files updated with a `## Logging` section specifying per-skill inputs/outputs
- Log file: `{project_dir}/logs/production.jsonl` — append-only, one JSON object per line

### New Skills

- `scoring-narrative-quality` — score a compiled video on 5 narrative dimensions (hook, pacing, emotional arc, visual variety, payoff); composite 0–100; writes `scored` event to `production.jsonl`; recommends targeted `retention-driven-development` pass when composite < 70

---

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

## v1.0.1 — 2026-03-27

### Changes
- Renamed 15 skills to `gerund-object` naming convention
- Replaced `pnpm exec dotenv --` with `source .env &&` in all usage strings

---

## v1.0.0 — 2026-03-26

### Features
- 6 pack management skills: `generating-actor-pack`, `generating-character-pack`, `generating-scene-pack`, `generating-prop-pack`, `generating-costume-pack`, `prompt-template`
- 4 production pipeline reasoning skills: `breaking-down-video-script`, `extracting-video-entities`, `enriching-shot-details`, `checking-consistency`
- `running-video-production-pipeline` orchestrator
- Video generation skills: `writing-video-plan`, `writing-seedance15-prompt`, `generating-seedance15-video`, `upscaling-video`, `extracting-foreground`, `generating-thumbnail`, `compiling-video`
- Audio skills: `aligning-lyrics`, `generating-voiceover`
- Utilities: `replicate`, `downloading-youtube-video`
- Shared `skills/lib/pack-utils.js` for JSON I/O across pack skills
- GitHub Actions CI with Vitest test suite (173 tests)
