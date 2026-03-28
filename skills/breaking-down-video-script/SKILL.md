---
name: breaking-down-video-script
description: Use when converting any raw text (lyrics, screenplay, brief) into an indexed shot list and chapter summary for a video production.
---

# Script Breakdown

Converts any raw text input into a structured chapter and indexed shot list. The agent reads the input text, condenses it, divides it into shots, names each shot, and identifies characters and scenes per shot.

## Inputs

- Raw text (lyrics, screenplay, story brief) — provided by the user or read from `chapter.json#rawText`
- `--base-dir <path>` — project root
- `--chapter-dir <path>` — e.g. `<base-dir>/chapters/chap_abc`

## Dependencies

None. This is the first skill in the production pipeline.

## Workflow

1. Receive raw text input.
2. Condense the text: simplify language, remove stage directions not relevant to visuals, preserve meaning. Store as `condensedText`.
3. Divide condensed text into shots. Each shot covers one visual moment (4–8 seconds). Index from 1.
4. For each shot, identify: title, script excerpt, character names, scene names, status (`pending`).
5. Write `chapter.json`:
   ```bash
   # chapter.json is written manually by the agent — no script for this file
   ```
6. Write `shot-list.json` to `--chapter-dir`.
7. Validate:
   ```bash
   source .env && node skills/breaking-down-video-script/scripts/validate-shot-list.js \
     --file <chapter-dir>/shot-list.json
   ```

## Output

- `<chapter-dir>/chapter.json` — chapter metadata with raw and condensed text
- `<chapter-dir>/shot-list.json` — indexed shot array

## Validation

```bash
source .env && node skills/breaking-down-video-script/scripts/validate-shot-list.js --file <path>
```

Exits 0 on valid, 1 on invalid (error to stderr).

## Error Handling

- If condensed text loses meaning: show both versions to the user and ask to confirm before continuing.
- If a shot has no identifiable characters or scenes: leave arrays empty, do not invent them.
