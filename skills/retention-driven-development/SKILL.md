---
name: retention-driven-development
description: Use after all scenes are generated. Simulates 100 viewers per shot, scores retention, and regenerates weak shots below a threshold. Replace, don't patch.
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
   - **Lyric/beat sync** — if lyrics are present, does the visual action match the lyric moment? Otherwise (e.g., shorts without lyrics), does the visual action align with the main audio beat, hook, or voiceover emphasis?
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

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `project_dir`, `chapter_id`, `threshold` (retention score target)
**On completion** — key `outputs`: `shots_replaced` (count), `final_retention_score`
