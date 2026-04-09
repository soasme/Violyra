---
name: generating-song
description: Use to generate AI audio from approved lyrics and a style description. Prepares the generation prompt, waits for user to drop in the audio file, then validates it.
---

# Generating Song

Composes a generation prompt from lyrics and style, presents it to the user, then validates the audio file once the user places it.

Current music generation models (Suno, Udio, etc.) are not on Replicate. This skill is model-agnostic — the agent prepares the prompt and the user generates externally.

## Inputs

- `<chapter-dir>/lyrics.txt` — from `generating-lyrics`
- Style description (genre, BPM, instrumentation, mood)
- Optional: reference audio URL

## Workflow

1. Read `<chapter-dir>/lyrics.txt`
2. Compose generation prompt:
   ```
   Lyrics:
   <full lyrics text>

   Style: <genre>, <BPM> BPM, <instrumentation>, <mood>
   Reference: <URL if provided>
   ```
3. Present prompt to user
4. User generates audio in Suno, Udio, or another tool and saves to `<chapter-dir>/song.mp3`
5. Validate:
   ```bash
   source .env && node skills/generating-song/scripts/validate-song.js \
     --file <chapter-dir>/song.mp3
   ```
6. If valid, transition to `aligning-lyrics`

## Output

- `<chapter-dir>/song.mp3` (placed by user; validated by script)

## Validation

```bash
source .env && node skills/generating-song/scripts/validate-song.js --file <path>
```

Exits 0 if file exists, has a supported extension (.mp3 .wav .flac .m4a .ogg), and size > 0.
Exits 1 with error to stderr otherwise.

## After Validation

Transition to `aligning-lyrics`.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `lyrics_path`, `style_description`
**On completion** — key `outputs`: `audio_path`, `duration_s`
