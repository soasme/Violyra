---
name: generating-prop-pack
description: Use when creating, reading, updating, deleting, or listing global prop references. Props are physical objects reusable across projects.
---

# Generating Prop Pack

Manages global physical object references. A prop pack captures the appearance and identity of a physical object for consistent use across shots.

## Subcommands

```bash
source .env && node skills/generating-prop-pack/scripts/prop-pack.js <subcommand> [options]
```

### create
```bash
source .env && node skills/generating-prop-pack/scripts/prop-pack.js create \
  --base-dir <project-dir> --name "Vintage Guitar" \
  --description "Worn sunburst Telecaster, scratched body" \
  --tags '["instrument","music"]'
```
File: `<base-dir>/global/props/<id>/pack.json`.

### read / update / delete / list
Same flags as scene-pack (no `--appearance`).

## Logging

Log to `{project_dir}/project/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `prop_name`, `action` (`create`/`update`/`list`)
**On completion** — key `outputs`: `pack_path`, `prop_count`
