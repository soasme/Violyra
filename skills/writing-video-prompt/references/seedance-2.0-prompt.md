# Seedance 2.0 Prompt Reference

## Multi-Shot Support

Seedance 2.0 natively supports multi-shot sequences within a single generation (up to 15 seconds). Use `Shot switch.` as the delimiter between shots within one API call.

**Format:**

    [Shot 1]. Shot switch. [Shot 2]. Shot switch. [Shot 3].

Each shot must independently specify subject, action, camera framing, and motion intensity. Visual continuity across shots is maintained automatically — do not re-describe unchanged background elements.

## Word Budget

No fixed word limit. Concise and direct outperforms long compound descriptions.

## Audio

Seedance 2.0 does not generate native audio. Do not include audio cue instructions.

## Prompt Construction

    Subject → Action → Camera → Style

Motion-first: prioritize movement over static scene description.

## Motion Language

**Always use explicit intensity modifiers:**

    fast, violent, large, high frequency, strong, crazy, wildly, rapidly

Bad: "a duck flaps wings"
Good: "a duck flaps wings rapidly"

**Camera motions:** pan, zoom, aerial, follow, surround, handheld, push in, tilt, shot switch

**Sequential action:**

    Subject does action1, then action2, then action3.

## Image-to-Video

- Describe motion of elements present in the image only
- Do not contradict visual elements (e.g. if hands are empty, do not prompt holding an object)
- Do not change the setting

## Failure Cases

| Problem | Fix |
|---|---|
| Weak or absent motion | Add explicit intensity modifier |
| Confusing multi-subject scene | Chain subjects sequentially, not simultaneously |
| Redundant background description between shots | Remove — Seedance maintains continuity automatically |
