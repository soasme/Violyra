---
name: generating-scene-pack
description: Use when creating, reading, updating, deleting, or listing global scene/environment references. Scenes are reusable across projects.
---

# Generating Scene Pack

Manages global location/environment references. A scene pack captures the visual identity of a setting (description, reference images) for reuse across shots and projects.

## Subcommands

```bash
source .env && node skills/generating-scene-pack/scripts/scene-pack.js <subcommand> [options]
```

### create
```bash
source .env && node skills/generating-scene-pack/scripts/scene-pack.js create \
  --base-dir assets/ --name "Rooftop at Sunset" \
  --description "Urban rooftop, haze, golden hour light, graffiti walls" \
  --tags '["exterior","urban","dusk"]'
```
Returns created pack JSON. File: `<base-dir>/global/scenes/<id>/pack.json`.

### read / update / delete / list
Same flags as actor-pack, replacing `actor` with `scene`. No `--appearance` flag.

## Schema

See `docs/design-docs/2026-03-27-production-pipeline-design.md` for the full scene pack schema.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `scene_name`, `action` (`create`/`update`/`list`)
**On completion** — key `outputs`: `pack_path`, `scene_count`
