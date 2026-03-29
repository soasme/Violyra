# Seedance 1.5 Prompt Reference

## Multi-Shot Support

Seedance 1.5 is **single-shot only**. Generate one prompt per shot. Call `writing-video-prompt` once per shot.

## Word Budget

No fixed word limit. Concise and direct is better.

## Audio

Seedance 1.5 does not generate native audio. Do not include audio cue instructions.

## Prompt Construction

    Subject → Action → Camera → Style

Motion-first: describe what moves and how it moves.

## Motion Language

Use explicit intensity modifiers for all motion:

    fast, violent, wildly, rapidly, strongly, large, high frequency

**Camera motions:** pan, zoom, aerial, follow, surround, handheld, push in, tilt

**Sequential action:**

    Subject does action1, then action2, then action3.

## Image-to-Video

- Describe motion only — do not re-describe subject appearance
- Do not contradict the reference image (setting, subject, props)
- Do not introduce elements not present in the image

## Failure Cases

| Problem | Fix |
|---|---|
| Static output | Add explicit motion with intensity modifier |
| Subject appearance drifts across calls | Repeat the same visual descriptors in every call |
| Prompt too vague | Use "subject + action + camera" minimum structure |
