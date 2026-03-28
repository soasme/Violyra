---
name: checking-consistency
description: Use when detecting character/scene drift across shots after enriching-shot-details is complete. Produces a consistency report and optional optimized shot list.
---

# Consistency Check

Reads shot-list, shot-details, extraction-report, and referenced pack files to detect visual inconsistencies across shots. Produces a `consistency-report.json` with issues and an optional `optimizedShotList`.

## Inputs

- `<chapter-dir>/shot-list.json`
- `<chapter-dir>/shot-details.json`
- `<chapter-dir>/extraction-report.json`
- Referenced pack files under `<base-dir>/global/`
- `--chapter-dir <path>`, `--base-dir <path>`

## Dependencies

- `breaking-down-video-script`, `extracting-video-entities`, `enriching-shot-details` must all be complete.

## Workflow

1. Read all three chapter files and referenced packs.
2. Check for `character_drift`: same actor described differently in different shots.
3. Check for `scene_drift`: same scene described differently across shots.
4. Check for `prop_mismatch`: prop appears in shot entity refs but not in character composition.
5. Check for `costume_change_unintended`: costume changes without a scene change marker.
6. Check for `style_deviation`: atmosphere or mood-tag drift across consecutive shots with `followAtmosphere: true`.
7. For each issue, record: type, shotIndices, entityId, entityType, description, suggestion.
8. If issues require shot list changes, produce `optimizedShotList` with corrections applied.
9. Write `consistency-report.json`.
10. Validate output.
11. Present issues to user. If `optimizedShotList` is produced, ask before overwriting `shot-list.json`.

## Output

- `<chapter-dir>/consistency-report.json`

## Validation

```bash
source .env && node skills/checking-consistency/scripts/validate-consistency-report.js --file <path>
```

## Error Handling

- Never auto-apply `optimizedShotList` — always present to user first.
- If no issues found: write report with empty `issues` array and `optimizedShotList: null`.
