---
name: running-video-production-pipeline
description: Use when orchestrating breaking-down-video-script → extracting-video-entities → enriching-shot-details → checking-consistency for a chapter. Runs all four reasoning skills in sequence.
---

# Production Pipeline

Orchestrates the four reasoning skills for a single chapter. Call this skill instead of calling each reasoning skill individually. It manages sequencing, passes outputs between steps, and presents consistency issues for user review before proceeding.

## Inputs

- Raw text (lyrics, screenplay, story brief) OR existing `chapter.json` with `rawText`
- `--base-dir <path>` — project root
- `--chapter-dir <path>` — e.g. `<base-dir>/chapters/<chapter-id>` (create the directory if it does not exist)

## Workflow

Follow `skills/running-video-production-pipeline/references/workflow.md` step by step.

## Output

All four reasoning skill outputs for the chapter:
- `chapter.json`, `shot-list.json`, `extraction-report.json`, `shot-details.json`, `consistency-report.json`
- Pack files under `<base-dir>/global/` and `<base-dir>/characters/`

## Error Handling

- Stop between steps if any validator exits non-zero. Show the error and ask the user how to proceed.
- After checking-consistency: if `optimizedShotList` is non-null, present it to the user and ask before overwriting `shot-list.json`. If user approves, re-run enriching-shot-details and checking-consistency on the updated shot list.
