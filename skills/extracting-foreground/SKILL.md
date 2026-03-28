---
name: extract-foreground
description: Remove image backgrounds and produce transparent PNG outputs with Replicate 851-labs/background-remover. Use when asked to cut out subjects, remove backgrounds, or generate alpha-channel PNGs from images.
---

# Extract Foreground

Use `scripts/extract.js` to remove image backgrounds.

Run:
`REPLICATE_API_TOKEN=<token> node .agent/skills/extract-foreground/scripts/extract.js --input <input-image> --output <output-image>`
