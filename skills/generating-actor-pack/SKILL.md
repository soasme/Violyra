---
name: generating-actor-pack
description: Use when creating, reading, updating, deleting, or listing global actor appearance references. Actors are reusable across projects.
---

# Generating Actor Pack

Manages global physical appearance references for performers. An actor pack captures the "look" — appearance text, reference images — independent of any project role or costume. Always create an actor pack before referencing a performer in any shot.

## Subcommands

```bash
source .env && node skills/generating-actor-pack/scripts/actor-pack.js <subcommand> [options]
```

### create
```bash
source .env && node skills/generating-actor-pack/scripts/actor-pack.js create \
  --base-dir <project-dir> --name "Mia" \
  --appearance "short black hair, slim build, ~20s, distinctive freckles" \
  --description "Lead performer" --tags '["lead","female"]'
```
Returns the created pack JSON. File: `<base-dir>/global/actors/<id>/pack.json`.

### read
```bash
source .env && node skills/generating-actor-pack/scripts/actor-pack.js read \
  --base-dir <project-dir> --id actor_lz4x7
```

### update
```bash
source .env && node skills/generating-actor-pack/scripts/actor-pack.js update \
  --base-dir <project-dir> --id actor_lz4x7 --appearance "short black hair, updated"
```

### delete
```bash
source .env && node skills/generating-actor-pack/scripts/actor-pack.js delete \
  --base-dir <project-dir> --id actor_lz4x7
```

### list
```bash
source .env && node skills/generating-actor-pack/scripts/actor-pack.js list \
  --base-dir <project-dir> [--filter mia]
```

## Schema

See `docs/design-docs/2026-03-27-production-pipeline-design.md` for the full `global/actors/<id>/pack.json` schema.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `actor_name`, `action` (`create`/`update`/`list`)
**On completion** — key `outputs`: `pack_path`, `actor_count`
