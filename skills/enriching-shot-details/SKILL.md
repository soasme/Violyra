---
name: shot-detail
description: Use when enriching shots with cinematic parameters (framing, angle, movement, mood, frame prompts). Runs after entity-extraction.
---

# Shot Detail

Enriches each shot in a `shot-list.json` with cinematic parameters: camera shot size, angle, movement, duration, mood tags, atmosphere, VFX type, frame prompts, and dialog lines. Writes `shot-details.json`.

## Inputs

- `<chapter-dir>/shot-list.json` — from `script-breakdown`
- `<chapter-dir>/extraction-report.json` — from `entity-extraction` (provides sceneIds)
- `<chapter-dir>/shot-details.json` — optional, existing details to preserve/update
- `--chapter-dir <path>`

## Dependencies

- `script-breakdown` (shot-list.json)
- `entity-extraction` (extraction-report.json, for sceneIds)

## Workflow

1. Read `shot-list.json` and `extraction-report.json`.
2. For each shot, determine:
   - `cameraShot`: ECU | CU | MCU | MS | MLS | LS | ELS
   - `angle`: EYE_LEVEL | HIGH_ANGLE | LOW_ANGLE | BIRD_EYE | DUTCH | OVER_SHOULDER
   - `movement`: STATIC | PAN | TILT | DOLLY_IN | DOLLY_OUT | TRACK | CRANE | HANDHELD | STEADICAM | ZOOM_IN | ZOOM_OUT
   - `duration` (seconds, integer)
   - `moodTags` (free-form array)
   - `atmosphere` (free-form string)
   - `followAtmosphere` (bool — inherit atmosphere from previous source shot)
   - `vfxType`: NONE | PARTICLES | VOLUMETRIC_FOG | CG_DOUBLE | DIGITAL_ENVIRONMENT | MATTE_PAINTING | FIRE_SMOKE | WATER_SIM | DESTRUCTION | ENERGY_MAGIC | COMPOSITING_CLEANUP | SLOW_MOTION_TIME | OTHER
   - `sceneIds` from `extraction-report.json`
   - `firstFramePrompt`, `lastFramePrompt`, `keyFramePrompt`
   - `dialogLines` (array)
3. Write `shot-details.json`.
4. Validate output.

## Output

- `<chapter-dir>/shot-details.json`

## Validation

```bash
pnpm exec dotenv -- node skills/shot-detail/scripts/validate-shot-details.js --file <path>
```

## Error Handling

- If a shot has multiple scene IDs: pick the dominant scene for atmosphere inheritance.
- If `followAtmosphere: true` but no previous source shot: treat this shot as the source.
