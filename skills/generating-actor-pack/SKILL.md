---
name: generating-actor-pack
description: Use when creating, reading, updating, deleting, or listing global actor appearance references. Actors are reusable across projects.
---

# Generating Actor Pack

Manages global physical appearance references for performers. An actor pack captures the "look" — appearance text, reference images — independent of any project role or costume. Always create an actor pack before referencing a performer in any shot.

## Subcommands

```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js <subcommand> [options]
```

### create
```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js create \
  --base-dir assets/ --name "Mia" \
  --appearance "short black hair, slim build, ~20s, distinctive freckles" \
  --description "Lead performer" --tags '["lead","female"]'
```
Returns the created pack JSON. File: `<base-dir>/global/actors/<id>/pack.json`.

### read
```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js read \
  --base-dir assets/ --id actor_lz4x7
```

### update
```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js update \
  --base-dir assets/ --id actor_lz4x7 --appearance "short black hair, updated"
```

### delete
```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js delete \
  --base-dir assets/ --id actor_lz4x7
```

### list
```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js list \
  --base-dir assets/ [--filter mia]
```

## Schema

See `docs/design-docs/2026-03-27-production-pipeline-design.md` for the full `global/actors/<id>/pack.json` schema.
