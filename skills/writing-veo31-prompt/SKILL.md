---
name: writing-veo31-prompt
description: Write high-quality prompts for Google Veo 3.1 — text-to-video, reference-to-video (image-to-video), multi-shot scenes, and native synchronized audio.
---

# Veo 3.1 Prompt Writer

## Overview

Google Veo 3.1 is a flagship video generation model with cinematic realism, physics-accurate motion, and native audio synthesis. It supports four generation modes:

- **Text-to-Video** — generate video entirely from a prompt
- **Reference-to-Video (Image-to-Video)** — animate a reference image as the start frame
- **Start/End Frame Interpolation** — generate a natural transition between two images
- **Reference-Consistent Generation (R2V)** — use up to 3 reference images to maintain subject appearance across multiple clips

Veo 3.1 understands professional film terminology. Prompts that use cinematic language produce noticeably better results than plain descriptions.

**Veo 3.1 generates audio natively, synchronized to the video.** Include explicit audio cues — ambient sound, diegetic effects, dialogue, and music style — directly in the prompt.

---

## Input Schema

| Parameter          | Type    | Default   | Options / Range                                                 | Description                                                                                      |
|--------------------|---------|-----------|------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| `prompt`           | string  | —         | required                                                         | Text description of video content, motion, camera, and audio                                     |
| `duration`         | integer | `8`       | `4` `6` `8`                                                      | Video length in seconds                                                                          |
| `aspect_ratio`     | string  | `"16:9"`  | `"16:9"` `"9:16"`                                               | Landscape or portrait; ignored when `image` is provided                                          |
| `resolution`       | string  | `"1080p"` | `"720p"` `"1080p"`                                              | Output resolution; use 720p for drafts, 1080p for finals                                         |
| `image`            | string  | —         | HTTPS URL                                                        | Start frame for image-to-video; ideal size 1280×720 (16:9) or 720×1280 (9:16)                   |
| `last_frame`       | string  | —         | HTTPS URL                                                        | End frame for interpolation; requires `image`                                                    |
| `reference_images` | array   | `[]`      | 1–3 HTTPS URLs                                                   | Subject-consistent R2V; only with `aspect_ratio: "16:9"` and `duration: 8`; disabled if `last_frame` set |
| `negative_prompt`  | string  | —         | free text                                                        | Elements to exclude, e.g. "no camera shake, no lens distortion"                                  |
| `generate_audio`   | boolean | `true`    | `true` `false`                                                   | Native audio generation; set `false` only when adding custom audio in post-production            |
| `seed`             | integer | —         | any integer                                                      | Reproducible generation                                                                          |

**Duration guidance:**
- 4 s — establishing shots, product showcases, minimal motion
- 6 s — dialogue scenes, multi-stage action, narrative
- 8 s — complex sequences, extended atmosphere, R2V mode

---

## Prompt Construction Rules

### Text-to-Video

    Prompt =
    [Shot Type + Camera Movement] + [Subject Details] + [Action] + [Setting + Lighting + Mood] + [Audio Cues]

Minimum viable structure:

    [Subject] + [Action] + [Scene]

Full structure (3–6 sentences, 75–175 words):

    A [shot type] of [subject with specific appearance]. [Action sequence, temporally ordered]. [Setting: location, time of day, weather or atmosphere]. [Lighting and color tone]. [Audio: ambient sound, diegetic effects, dialogue, or music.]

### Reference-to-Video (Image-to-Video)

    Prompt =
    [Animated Element] + [Motion Description] + [Environment Motion] + [Camera Movement] + [Audio Cues]

Focus on what moves. Do not re-describe the subject — the reference image anchors appearance. Describe motion only.

    The [element in the image] [moves/acts], [background element moves], camera [motion]. [Audio cue].

---

## Writing Principles

### 1. Cinematic Language

Veo 3.1 responds strongly to professional film terminology. Use it to precisely control composition, motion, and tone.

**Camera movements:**

    dolly in / dolly out
    tracking shot
    crane shot descending
    handheld follow
    slow pan left / right
    tilt up / tilt down
    aerial orbit
    POV shot

**Shot types:**

    extreme close-up
    close-up
    medium shot
    wide shot
    establishing wide
    two-shot
    over-the-shoulder
    low-angle
    Dutch angle

**Lens and focus:**

    shallow depth of field
    rack focus from [A] to [B]
    wide-angle lens
    macro lens
    deep focus
    soft focus

**Lighting:**

    golden hour backlight
    harsh overhead fluorescents
    dappled forest light
    volumetric fog rays
    practical lamplight
    rim light
    cool blue side-lighting

Example:

    A slow dolly forward on a medium shot frames a jazz musician at a dim club. Warm practical lamplight falls across the upright bass, shallow depth of field rendering the crowd as warm bokeh behind.

---

### 2. Physical Realism

Veo 3.1 models real-world physics. Prompts that describe physical properties yield more convincing results than abstract adjectives.

Describe:
- **Fabric** — "linen shirt billowing in the wind", "wet silk clinging to shoulders"
- **Liquid** — "rain striking puddles in expanding rings", "coffee swirling slowly in a ceramic cup"
- **Dust and particles** — "chalk dust drifting in afternoon light", "pollen dispersing from a shaken flower"
- **Light behavior** — "caustics rippling across the pool floor", "lens flare cutting across the shot as the camera pans"
- **Impact and deformation** — "mud splashing on impact", "paper crumpling under a hand"

---

### 3. Native Audio Cues

Veo 3.1 generates synchronized audio automatically. **Always describe the audio you want** — silence about sound leaves it to the model's defaults.

Include audio as a dedicated sentence or labeled block at the end of the prompt.

**Audio types:**
- **Ambient / environmental** — room tone, weather, crowd texture
- **Diegetic effects** — sounds caused by on-screen actions
- **Dialogue** — use quotation marks with delivery tone
- **Music** — specify genre, tempo, instrumentation, emotional arc

**Formats:**

    [Ambient] Quiet café ambience — low conversation, espresso hiss, distant street noise.
    [SFX] Footsteps crunching on frost, keys jingling as the door opens.
    [Dialogue] She leans forward and says quietly, "We're not safe here."
    [Music] A slow-building string arrangement, tension rising toward the cut.

**To suppress audio:**

    Set `generate_audio: false` in the API call when adding custom audio in post-production.

---

### 4. Sequential Action

Veo 3.1 supports temporal progression within a single clip. Order actions explicitly.

    Subject performs action A, then action B, then action C.

Example:

    The chef picks up the knife, slices through the red pepper with a single clean stroke, then sweeps the pieces into the pan — oil hissing on contact.

---

### 5. Multi-Character Scenes

Describe each character distinctly. Assign actions in sequence rather than simultaneously to avoid confusion.

    Character A [action]. Meanwhile, character B [action]. The camera [movement] to include both.

Example:

    An older man in a grey coat sits reading at a park bench. A young child runs toward him, pigtails flying, coat open in the wind. The camera tracks the child from behind, then widens to frame them both as she jumps onto the bench beside him.

---

## Multi-Shot Scene Support

Multi-shot sequences are produced by chaining separate Veo 3.1 clips. Use `"Cut to:"` as the shot delimiter when planning or scripting a sequence. Each shot segment becomes a separate API call.

**Delimiter:** `Cut to:`

**Three-shot example — Music Video Night Street Scene:**

    Shot 1:
    Wide establishing shot of a rain-slicked street at night, neon signs reflecting in puddles, a lone figure walking toward camera in the distance. Camera holds static. [Ambient] City rain — tire hiss on wet asphalt, distant siren, rain tapping awnings.

    Cut to:

    Shot 2:
    Medium shot on the figure — a young woman in a dark leather jacket, rain running down her face, eyes forward. Slow dolly in as she walks. [SFX] Footsteps on wet pavement, rain striking leather.

    Cut to:

    Shot 3:
    Extreme close-up on her hand pushing open a heavy door, warm light spilling out. Rack focus from hand to the warm interior beyond. [SFX] Door hinge creak, sudden warmth of muffled bass music from inside.

**When scripting multi-shot sequences:**
- Write each shot as a standalone prompt (one clip = one API call)
- Maintain consistent character appearance descriptions across shots
- Use `reference_images` (R2V mode) to preserve subject consistency

---

## Reference-to-Video Guidelines

When providing a start frame (`image`), follow these rules:

**Do:**
- Describe motion of elements that are already present in the image
- Extend the environment (wind moves trees, water ripples, clouds drift)
- Keep character appearance consistent with the reference

**Do not:**
- Introduce subjects not present in the image
- Change the setting (image shows forest; do not prompt a beach)
- Contradict visual elements (image shows empty hands; do not prompt holding an object)
- Re-describe the subject's appearance in detail — the image anchors it

**Common reference-to-video conflicts to avoid:**

| Image Content          | Bad Prompt Fragment          | Good Prompt Fragment                         |
|------------------------|------------------------------|----------------------------------------------|
| Man in blue jacket     | "woman in a red coat"        | "he turns slowly, coat rippling in the wind" |
| Indoor scene           | "on a mountaintop"           | "light from the window shifts, dust drifts"  |
| Open empty hand        | "gripping a phone"           | "fingers slowly unfurl, palm upward"         |
| Daytime scene          | "moonlight overhead"         | "afternoon light softening to golden hour"   |

---

## Best Practices

**Front-load camera and shot type.** Veo prioritizes the start of the prompt. Open with shot type and movement.

**One dominant action per clip.** If you need a character to walk, speak, and gesture, generate them as separate clips and edit together.

**Use specific visual markers for characters.** Name distinctive features explicitly: "auburn hair in a loose bun", "silver-rimmed glasses", "burgundy vest with a pocket watch chain". Repeat these across clips to maintain consistency.

**Specify lighting source and quality.** "Warm" is vague. "Warm practical lamplight from the left, casting a long shadow right" is specific.

**Use negative_prompt for persistent artifacts.** "No camera shake, no lens distortion, no text overlays" suppresses common artifacts.

**Iterate with 720p / 4s first.** Validate composition and motion before committing to 1080p / 8s.

**Keep prompt length 75–175 words.** Below 75 words yields generic results. Above 175 words causes the model to deprioritize elements unpredictably.

---

## Failure Cases

| Problem                         | Cause                                                      | Fix                                                                          |
|---------------------------------|------------------------------------------------------------|------------------------------------------------------------------------------|
| Character appearance drifts     | Insufficient visual anchoring across frames                | Add more distinctive physical markers; use `reference_images` for multi-clip |
| Objects appear or disappear     | Temporal inconsistency from over-complex action            | Reduce to one dominant action; split into shorter clips                      |
| Audio out of sync with action   | No explicit audio cues in prompt                           | Add labeled `[SFX]` or `[Ambient]` sentences; describe timing to action      |
| Generic, flat result            | Prompt too short or too abstract                           | Add shot type, lighting, and specific physical details                       |
| Contradictory scene elements    | Conflicting constraints in the same prompt                 | Remove contradictions (e.g., "bright sunny moonlight")                       |
| Unwanted text or watermarks     | Default model behavior on certain scene types              | Add "no text overlays, no watermarks" to `negative_prompt`                   |
| R2V reference ignored           | `last_frame` set, or wrong aspect_ratio / duration         | R2V requires `aspect_ratio: "16:9"`, `duration: 8`, no `last_frame`          |

---

## Example Outputs

### Example 1 — Single Shot Text-to-Video (Music Video)

**Context:** Opening shot for a melancholic indie track, night street, female vocalist subject.

**Prompt:**

    Wide establishing shot of a rain-slicked city street at night, neon reflections fracturing in puddles. A young woman in a dark coat walks slowly toward camera, head down, hands in pockets. The camera holds static as she enters frame, then begins a very slow dolly in. Rain streaks through streetlight beams. Shallow depth of field blurs the street behind her into colored bokeh. [Ambient] City rain — tire hiss on wet asphalt, distant traffic, rain tapping a metal awning above. [Music] Sparse piano, low register, single-note melody, melancholic.

**API inputs:**

    {
      "prompt": "...",
      "duration": 8,
      "aspect_ratio": "16:9",
      "resolution": "1080p",
      "generate_audio": true
    }

---

### Example 2 — Multi-Shot Reference-to-Video (Three-Shot Sequence)

**Context:** Artist playing guitar by a window; reference image used for character consistency.

**Shot 1 prompt (with `image` reference):**

    His fingers move across the guitar strings, a slow strum fading into silence. Afternoon light from the window deepens to golden. Camera holds medium on hands and instrument. [SFX] Acoustic guitar, a single chord ringing out and decaying. [Ambient] Quiet room tone, distant birds outside the window.

**Cut to:**

**Shot 2 prompt (with same `reference_images` array):**

    Medium shot on his face — eyes closed, slight movement of lips, absorbed in the music. A slow rack focus from his face to the sunlit window behind. [Ambient] Room tone, wind outside the glass. [Music] The guitar chord from the previous shot fades into a soft fingerpicked melody.

**Cut to:**

**Shot 3 prompt (text-to-video):**

    Wide shot of the room from outside the window looking in. The figure at the guitar is a warm silhouette against the amber interior light. Camera slowly pulls back. [Ambient] Guitar fading under birdsong, light wind in tree branches.

**Shot 1 API inputs (image-to-video):**

    {
      "prompt": "...",
      "image": "https://example.com/guitarist-reference.jpg",
      "duration": 8,
      "resolution": "1080p",
      "generate_audio": true
    }

**Shot 2 API inputs (R2V for character consistency):**

    {
      "prompt": "...",
      "reference_images": ["https://example.com/guitarist-reference.jpg"],
      "duration": 8,
      "aspect_ratio": "16:9",
      "resolution": "1080p",
      "generate_audio": true
    }

**Shot 3 API inputs (text-to-video):**

    {
      "prompt": "...",
      "duration": 8,
      "aspect_ratio": "16:9",
      "resolution": "1080p",
      "generate_audio": true
    }
