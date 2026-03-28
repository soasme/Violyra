---
name: writing-seedance20-prompt
description: Generate high-quality Seedance 2.0 video prompts for image-to-video or text-to-video with clear motion, camera language, temporal action, and multi-shot scene support.
---

# Seedance 2.0 Prompt Writer

## Overview

The `seedance20_prompt_writer` skill generates high-quality prompts for Seedance 2.0 video generation, supporting both:

- Image-to-Video
- Text-to-Video

The skill focuses on motion clarity, camera language, and temporal actions, enabling the generation of dynamic cinematic video prompts.

Seedance 2.0 responds strongly to director-style instructions: explicit motion descriptions, sequential actions, camera movements, and structured multi-shot sequences. Prompts should prioritize movement and timing rather than static description.

Compared to Seedance 1.5, Seedance 2.0 provides:

- More stable prompt interpretation across complex multi-subject scenes
- Stronger temporal consistency and fluid motion
- Native multi-shot storyboarding with smooth transitions in a single generation
- Multimodal input support (image, video, audio, text)

---

# Capability

This skill converts a scene description or storyboard idea into an optimized Seedance 2.0 prompt.

It supports:

- subject motion design
- multi-action sequences
- multi-character interaction
- cinematic camera movement
- intensity modifiers
- multi-shot scene sequences

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
        },
        "shots": {
          "type": "array",
          "description": "List of shot descriptions for multi-shot sequences",
          "items": {"type": "string"}
        }
      },
      "required": ["subject"]
    }

---

# Output

The skill returns a single Seedance 2.0 prompt string optimized for motion clarity.

Single-shot example:

    A fat pig spinning wildly in muddy puddles, ducks flapping wings rapidly around it, mud splashing everywhere. Camera slowly pushes in, then quick pan following a duck escaping the splash.

Multi-shot example:

    Wide shot of a quiet farmyard, ducks waddling slowly. Shot switch. Close-up of a duck suddenly flapping wings violently, splashing water everywhere. Shot switch. Aerial view pulling back to reveal the whole chaotic farmyard.

---

# Prompt Construction Rules

## Core Formula

Seedance 2.0 prompts follow a director's script structure:

    Subject → Action → Camera → Style → Constraints

## Image-to-Video

    Prompt =
    [Subject] + [Movement],
    [Background] + [Movement],
    [Camera] + [Movement]

Focus on moving parts.

Avoid describing static elements.

---

## Text-to-Video

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

Seedance 2.0 responds strongest to movement.

Describe:

- subject motion
- environment motion
- camera motion

Example:

    A cow jumps over a fence, hay flying into the air, camera follows the cow with a fast pan.

---

## 3. Sequential Action

Seedance 2.0 supports temporal sequences.

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

Seedance 2.0 requires motion intensity to be explicit.

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

# Multi-Shot Scene Support

Seedance 2.0 natively supports multi-shot sequences within a single generation (up to 15 seconds). Use `Shot switch.` as the delimiter between shots to trigger a scene cut.

## Format

    [Shot 1 description]. Shot switch. [Shot 2 description]. Shot switch. [Shot 3 description].

Each shot should independently specify:

- subject and action
- camera framing (wide shot, close-up, medium shot, aerial, etc.)
- motion intensity

## 3-Shot Example

    Wide shot of a rooster strutting across a sunlit farmyard, tail feathers fanning boldly. Shot switch. Medium shot of chickens scattering rapidly as the rooster charges forward, feathers flying. Shot switch. Close-up of the rooster crowing triumphantly on a fence post, wings spread wide, camera slowly pushing in.

## Notes

- Each shot should be self-contained enough to read independently.
- Visual continuity is maintained by Seedance 2.0 automatically — you do not need to re-describe unchanged background elements.
- Use varied framing (wide, medium, close-up, aerial) across shots to create cinematic rhythm.
- Transitions are smooth by default; no additional transition keyword is required.

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

### Use structured shot lists for multi-shot scenes

Good:

    Wide shot of an empty street at night, rain falling heavily. Shot switch. Close-up of boots splashing through a puddle, camera following at ground level. Shot switch. Aerial view rising above the rooftops as lightning flashes across the sky.

---

# Example Outputs

## Example 1 — Farm Comedy (Single Shot)

    A pig runs wildly across a muddy farmyard, chickens scatter rapidly, mud splashing everywhere. Camera follows the pig with a fast pan, handheld motion.

---

## Example 2 — Animal Chaos (Single Shot)

    A rooster jumps onto a fence and crows loudly, wings flapping vigorously, goats below run around crazily. Camera slowly pushes in.

---

## Example 3 — Dramatic Scene (Single Shot)

    A horse gallops quickly across a dusty farm road, dust rising strongly behind its hooves. Camera follows from the side with a smooth tracking shot.

---

## Example 4 — Multi-Shot Narrative

    Wide shot of a quiet farmyard at dawn, mist hanging low over the grass. Shot switch. Medium shot of a rooster strutting boldly to the center of the yard, feathers ruffling in the breeze. Shot switch. Close-up of the rooster throwing its head back and crowing powerfully, camera slowly pushing in.

---

# Failure Cases

Avoid:

- static description
- negative prompts
- contradicting scene
- vague actions
- reintroducing background elements between shots (redundant, not harmful but bloats prompt)

Bad prompt:

    A farmyard scene with animals.

---

# Summary

The key to Seedance 2.0 prompts is:

    Subject → Action → Camera → Style → Constraints

and

    Clear actions + camera motion + intensity

For multi-shot scenes:

    Shot 1. Shot switch. Shot 2. Shot switch. Shot 3.
