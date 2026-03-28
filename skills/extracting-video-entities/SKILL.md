---
name: entity-extraction
description: Use when populating actor, scene, prop, and costume packs from a shot list. Runs after script-breakdown, before shot-detail.
---

# Entity Extraction

Reads a `shot-list.json`, identifies all named entities (characters, scenes, props, costumes), creates or reuses pack files for each, and writes an `extraction-report.json` mapping entity IDs to shots.

## Inputs

- `<chapter-dir>/shot-list.json` — produced by `script-breakdown`
- `--base-dir <path>` — project root
- `--chapter-dir <path>` — e.g. `<base-dir>/chapters/chap_abc`

## Dependencies

- `script-breakdown` must have run first (produces `shot-list.json`)
- Pack management scripts must be available for creating new packs

## Workflow

1. Read `shot-list.json`.
2. For each shot, collect `characterNames` and `sceneNames`.
3. For each unique name:
   a. Run `list --filter <name>` on the relevant pack script to check for an existing pack (fuzzy name match).
   b. If found, reuse the existing ID.
   c. If not found, run `create` to create a new pack.
4. Build `shotEntityRefs`: for each shot, list the resolved actor/scene/prop/costume IDs.
   - Populate `actorIds` (not `characterIds` — character creation is a separate deliberate step).
5. Build `newEntities`: IDs of packs created in this run only.
6. Write `extraction-report.json` to `--chapter-dir`.
7. Validate:
   ```bash
   pnpm exec dotenv -- node skills/entity-extraction/scripts/validate-extraction-report.js \
     --file <chapter-dir>/extraction-report.json
   ```

## Output

- Pack files under `<base-dir>/global/` and `<base-dir>/characters/`
- `<chapter-dir>/extraction-report.json`

## Validation

```bash
pnpm exec dotenv -- node skills/entity-extraction/scripts/validate-extraction-report.js --file <path>
```

## Error Handling

- If a name is ambiguous (multiple pack matches): present options to user and ask which to use.
- Never auto-create character packs — that is a deliberate agent step done after reviewing extraction results.
- On re-run: overwrite `extraction-report.json` fully. Never delete existing packs.
