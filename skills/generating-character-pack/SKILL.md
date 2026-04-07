---
name: generating-character-pack
description: Use when creating, reading, updating, deleting, or listing project-scoped character compositions (actor + costume + props).
---

# Generating Character Pack

Manages project-scoped character compositions. A character pack links one actor (appearance) with an optional costume and zero or more props into a named role for a specific production.

## Subcommands

```bash
source .env && node skills/generating-character-pack/scripts/character-pack.js <subcommand> [options]
```

### create
```bash
source .env && node skills/generating-character-pack/scripts/character-pack.js create \
  --base-dir <project-dir> --name "Mia — Stage Role" \
  --actor-id actor_lz4x7 \
  --costume-id costume_lz4xa \
  --prop-ids '["prop_lz4xb"]' \
  --description "Project-specific role"
```
Validates that `actor-id` references an existing actor pack. File: `<base-dir>/characters/<id>/pack.json`.

### read / update / delete / list
Same `--base-dir`, `--id`, `--filter` flags. Update accepts `--actor-id`, `--costume-id`, `--prop-ids`.

## Logging

Log to `{project_dir}/project/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `character_name`, `actor_ref`, `action` (`create`/`update`/`list`)
**On completion** — key `outputs`: `pack_path`, `character_count`
