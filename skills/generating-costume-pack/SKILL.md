---
name: generating-costume-pack
description: Use when creating, reading, updating, deleting, or listing global costume references. Costumes are reusable across projects.
---

# Generating Costume Pack

Manages global costume/outfit references. A costume pack describes a complete outfit for consistent visual identity across shots and productions.

## Subcommands

```bash
source .env && node skills/generating-costume-pack/scripts/costume-pack.js <subcommand> [options]
```

### create
```bash
source .env && node skills/generating-costume-pack/scripts/costume-pack.js create \
  --base-dir assets/ --name "Punk Outfit" \
  --description "Black leather jacket, torn jeans, combat boots, silver chains" \
  --tags '["punk","dark"]'
```
File: `<base-dir>/global/costumes/<id>/pack.json`.

### read / update / delete / list
Same flags as scene-pack (no `--appearance`).

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `costume_name`, `action` (`create`/`update`/`list`)
**On completion** — key `outputs`: `pack_path`, `costume_count`
