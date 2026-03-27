---
name: generating-prop-pack
description: Use when creating, reading, updating, deleting, or listing global prop references. Props are physical objects reusable across projects.
---

# Generating Prop Pack

Manages global physical object references. A prop pack captures the appearance and identity of a physical object for consistent use across shots.

## Subcommands

```bash
pnpm exec dotenv -- node skills/generating-prop-pack/scripts/prop-pack.js <subcommand> [options]
```

### create
```bash
pnpm exec dotenv -- node skills/generating-prop-pack/scripts/prop-pack.js create \
  --base-dir assets/ --name "Vintage Guitar" \
  --description "Worn sunburst Telecaster, scratched body" \
  --tags '["instrument","music"]'
```
File: `<base-dir>/global/props/<id>/pack.json`.

### read / update / delete / list
Same flags as scene-pack (no `--appearance`).
