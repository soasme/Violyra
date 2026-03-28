# Chapter Production Workflow

## Step 1 — Script Breakdown

- Skill: `script-breakdown`
- Input: raw text (provided by user or read from `chapter.json#rawText`)
- Output: `<chapter-dir>/chapter.json`, `<chapter-dir>/shot-list.json`
- Validation: `pnpm exec dotenv -- node skills/script-breakdown/scripts/validate-shot-list.js --file <chapter-dir>/shot-list.json`
- Decision: if condensedText significantly changes the meaning of the source text, show both to the user and ask to confirm before continuing.

## Step 2 — Entity Extraction

- Skill: `entity-extraction`
- Input: `<chapter-dir>/shot-list.json`
- Output: pack files under `<base-dir>/global/` and `<base-dir>/characters/`, `<chapter-dir>/extraction-report.json`
- Validation: `pnpm exec dotenv -- node skills/entity-extraction/scripts/validate-extraction-report.js --file <chapter-dir>/extraction-report.json`
- Decision: for each new entity name, run `list --filter <name>` on the relevant pack script before creating. Fuzzy-match by name to avoid duplicates. If multiple matches, present options to user.

## Step 3 — Shot Detail

- Skill: `shot-detail`
- Input: `<chapter-dir>/shot-list.json`, `<chapter-dir>/extraction-report.json`
- Output: `<chapter-dir>/shot-details.json`
- Validation: `pnpm exec dotenv -- node skills/shot-detail/scripts/validate-shot-details.js --file <chapter-dir>/shot-details.json`
- Decision: for shots with multiple sceneIds, pick the dominant scene for atmosphere inheritance. If a shot has `followAtmosphere: true` but no preceding source shot, treat it as a source shot.

## Step 4 — Consistency Check

- Skill: `consistency-check`
- Input: `<chapter-dir>/shot-list.json`, `<chapter-dir>/shot-details.json`, `<chapter-dir>/extraction-report.json`, referenced pack files
- Output: `<chapter-dir>/consistency-report.json`
- Validation: `pnpm exec dotenv -- node skills/consistency-check/scripts/validate-consistency-report.js --file <chapter-dir>/consistency-report.json`
- Decision: if issues found, present them to the user. If `optimizedShotList` is non-null, ask: "Apply the optimized shot list? (Y/N)". If yes, overwrite `shot-list.json` and re-run Steps 3 and 4. If no, continue with current shot list.
