# Veo 3.1 Prompt Reference

## Multi-Shot Support

Veo 3.1 natively supports multi-shot sequences. Use `Cut to:` as the delimiter between shots when writing a chained prompt. Each shot segment maps to a separate API call — the chained prompt is for planning; submit one API call per shot.

**Format:**

    [Shot 1 prompt]

    Cut to:

    [Shot 2 prompt]

## Word Budget

75–175 words per shot. Below 75 yields generic results; above 175 causes the model to deprioritize elements unpredictably.

## Native Audio

Veo 3.1 generates synchronized audio. Always include explicit audio cues as a labeled sentence at the end of each shot prompt:

    [Ambient] City rain — tire hiss, distant siren, rain tapping an awning.
    [SFX] Footsteps on wet pavement, keys jingling.
    [Dialogue] She leans forward and says quietly, "We're not safe here."
    [Music] Sparse piano, low register, single-note melody, melancholic.

Set `generate_audio: false` in the API call only when adding custom audio in post-production.

## Prompt Construction

    [Shot Type + Camera Movement] + [Subject Details] + [Action] + [Setting + Lighting + Mood] + [Audio Cues]

Full structure (3–6 sentences):

    A [shot type] of [subject with appearance]. [Action, temporally ordered]. [Setting: location, time, atmosphere]. [Lighting and color tone]. [Audio: ambient, effects, dialogue, or music.]

For image-to-video: describe motion of elements present in the image only. Do not re-describe the subject's appearance or introduce elements not in the reference image.

## Cinematic Language

**Camera movements:** dolly in / dolly out, tracking shot, crane shot descending, handheld follow, slow pan left / right, tilt up / tilt down, aerial orbit, POV shot

**Shot types:** extreme close-up, close-up, medium shot, wide shot, establishing wide, two-shot, over-the-shoulder, low-angle, Dutch angle

**Lens / focus:** shallow depth of field, rack focus from [A] to [B], wide-angle lens, macro lens, deep focus, soft focus

**Lighting:** golden hour backlight, harsh overhead fluorescents, dappled forest light, volumetric fog rays, practical lamplight, rim light, cool blue side-lighting

## Physical Realism

Describe physical properties rather than abstract feelings:
- Fabric: "linen shirt billowing in the wind", "wet silk clinging to shoulders"
- Liquid: "rain striking puddles in expanding rings"
- Particles: "chalk dust drifting in afternoon light"
- Light: "caustics rippling across the pool floor"
- Impact: "mud splashing on impact", "paper crumpling under a hand"

## Negative Prompt

Use `negative_prompt` to suppress persistent artifacts:
> "no camera shake, no lens distortion, no text overlays, no watermarks"

## Failure Cases

| Problem | Fix |
|---|---|
| Character appearance drifts | Add distinctive physical markers; use `reference_images` for multi-clip |
| Audio out of sync | Add labeled `[SFX]` / `[Ambient]` sentences |
| Generic flat result | Add shot type, lighting, specific physical details |
| Contradictory scene elements | Remove conflicts (e.g. "bright sunny moonlight") |
| R2V reference ignored | Requires `aspect_ratio: "16:9"`, `duration: 8`, no `last_frame` |
