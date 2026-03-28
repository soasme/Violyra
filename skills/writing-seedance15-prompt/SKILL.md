---
name: seedance15-prompt-writer
description: Generate high-quality Seedance 1.5 video prompts for image-to-video or text-to-video with clear motion, camera language, and temporal action.
---

# Seedance 1.5 Prompt Writer

## Overview

The `seedance15_prompt_writer` skill generates high-quality prompts for Seedance 1.5 video generation, supporting both:

- Image-to-Video
- Text-to-Video

The skill focuses on motion clarity, camera language, and temporal actions, enabling the generation of dynamic cinematic video prompts.

Seedance responds strongly to explicit motion descriptions, sequential actions, and camera movements. Prompts should prioritize movement and timing rather than static description.

---

# Capability

This skill converts a scene description or storyboard idea into an optimized Seedance prompt.

It supports:

- subject motion design
- multi-action sequences
- multi-character interaction
- cinematic camera movement
- intensity modifiers
- shot switching

---

# Input Schema

    {
      "type": "object",
      "properties": {
        "mode": {
          "type": "string",
          "enum": ["image_to_video", "text_to_video"]
        },
        "subject": {
          "type": "string"
        },
        "scene": {
          "type": "string"
        },
        "actions": {
          "type": "array",
          "items": {"type": "string"}
        },
        "camera": {
          "type": "array",
          "items": {"type": "string"}
        },
        "style": {
          "type": "string"
        },
        "intensity": {
          "type": "string"
        }
      },
      "required": ["subject"]
    }

---

# Output

The skill returns a single Seedance prompt string optimized for motion clarity.

Example:

    A fat pig spinning wildly in muddy puddles, ducks flapping wings rapidly around it, mud splashing everywhere. Camera slowly pushes in, then quick pan following a duck escaping the splash.

---

# Prompt Construction Rules

## Core Structure

### Image-to-Video

    Prompt =
    [Subject] + [Movement],
    [Background] + [Movement],
    [Camera] + [Movement]

Focus on moving parts.

Avoid describing static elements.

---

### Text-to-Video

    Prompt =
    [Subject] + [Movement] + [Scene] + [Camera] + [Style]

Minimum structure:

    subject + motion + scene

---

# Prompt Writing Principles

## 1. Prefer Simple Language

Use clear, short descriptions.

Bad:

    A very complicated cinematic situation where a pig appears to perform a rotational maneuver.

Good:

    A pig spins wildly in mud.

---

## 2. Motion First

Seedance responds strongest to movement.

Describe:

- subject motion
- environment motion
- camera motion

Example:

    A cow jumps over a fence, hay flying into the air, camera follows the cow with a fast pan.

---

## 3. Sequential Action

Seedance supports temporal sequences.

Format:

    subject + action1 + action2

Example:

    A rooster flaps wings, jumps onto a fence, crows loudly.

---

## 4. Multi-Character Interaction

You may chain subjects.

Example:

    A pig runs across the yard, chickens scatter wildly, a goat chases the pig.

---

## 5. Camera Language

Supported camera motions:

- pan
- zoom
- aerial
- follow
- surround
- handheld
- push in
- tilt
- shot switch

Example:

    Camera slowly pushes in, then shot switch to aerial view.

---

## 6. Degree Adverbs

Seedance requires motion intensity to be explicit.

Recommended modifiers:

    fast
    violent
    large
    high frequency
    strong
    crazy
    wildly
    rapidly

Example:

Bad:

    a duck flaps wings

Good:

    a duck flaps wings rapidly

---

# Shot Transition Rules

When writing multiple shots:

1. explicitly state "shot switch"
2. describe the new scene

Example:

    A cow runs wildly through the barn.

    Shot switch.

    Close-up of chickens scattering rapidly across straw.

---

# Common Prompt Patterns

## Pattern 1 — Single Motion

    A goat jumps quickly onto a wooden fence, hay blowing in the wind.

---

## Pattern 2 — Continuous Motion

    A pig slips in mud, rolls wildly, stands up shaking mud everywhere.

---

## Pattern 3 — Multi Subject

    A cow runs across the farmyard, chickens scatter quickly, a dog chases them playfully.

---

## Pattern 4 — Camera Focus

    A rooster flaps wings and jumps onto a fence. Camera slowly pushes in, then pans to the sunrise behind the farm.

---

## Pattern 5 — Shot Sequence

    Wide shot of a quiet farmyard, ducks waddling slowly.

    Shot switch.

    Close-up of a duck suddenly flapping wings violently, splashing water everywhere.

---

# Image-to-Video Guidelines

When using an input image:

- follow the image composition
- do not contradict visual elements

Example problems:

| Image Content | Bad Prompt |
|---|---|
| man | woman dancing |
| grassland | cafe interior |
| empty hand | hand wearing jewelry |

Always extend the image, not change it.

---

# Best Practices

### Focus on moving elements

Good:

    The sheep runs quickly across the hill, grass bending in the wind.

Bad:

    A sheep stands in a beautiful landscape with mountains.

---

### Combine motion layers

Good:

    A pig spins wildly in mud, ducks flap wings rapidly, mud splashes everywhere.

---

### Add emotional dynamics

Example:

    A goat jumps nervously onto a fence, chickens panic and scatter rapidly.

---

# Example Outputs

## Example 1 — Farm Comedy

    A pig runs wildly across a muddy farmyard, chickens scatter rapidly, mud splashing everywhere. Camera follows the pig with a fast pan, handheld motion.

---

## Example 2 — Animal Chaos

    A rooster jumps onto a fence and crows loudly, wings flapping vigorously, goats below run around crazily. Camera slowly pushes in.

---

## Example 3 — Dramatic Scene

    A horse gallops quickly across a dusty farm road, dust rising strongly behind its hooves. Camera follows from the side with a smooth tracking shot.

---

# Failure Cases

Avoid:

- static description
- negative prompts
- contradicting scene
- vague actions

Bad prompt:

    A farmyard scene with animals.

---

# Summary

The key to Seedance prompts is:

    Movement > Subject > Scene

and

    Clear actions + camera motion + intensity
