---
name: lyrics-force-alignment
description: Force-align ground-truth lyric lines to audio using Replicate dashed/whisperx-subtitles-replicate word timestamps as noisy hints, then output aligned JSON and optional SRT/LRC.
---

# Lyrics Force Alignment

Use `scripts/align.js` to align exact lyric lines against a song audio file.
The script treats WhisperX word timestamps as approximate hints, then remaps timing back to your provided lyric lines.

Always run through dotenv so `REPLICATE_API_TOKEN` is loaded:
`pnpm exec dotenv -- <command>`

## Dependencies

- Node.js 20+ (for `fetch`, `FormData`, `Blob`, `parseArgs`)
- `pnpm` dependencies installed at repo root (`pnpm install`)
- `REPLICATE_API_TOKEN` available in `.env` or environment

No additional npm packages are required.

## Install / Setup

1. Install dependencies:
`pnpm install`

2. Put your Replicate token in `.env`:
`REPLICATE_API_TOKEN=<your_token>`

3. Prepare input files:
- audio: for example `song.mp3`
- lyrics: for example `lyrics.txt` (one lyric line per non-empty line)

## Workflow

Run:
`pnpm exec dotenv -- node .agents/skills/lyrics-force-alignment/scripts/align.js --audio song.mp3 --lyrics lyrics.txt --json --srt --lrc`

Default outputs:

- Approximate WhisperX segments: `assets/approximate-lyric-segmentation.json`
- Aligned line-level JSON: `assets/aligned_lyrics.json`
- Subtitles: `assets/subtitle.srt`
- LRC: `assets/subtitle.lrc`

## Key Options

- `--audio <path>`: required local audio file path.
- `--lyrics <path>`: required lyric text file.
- `--json`, `--srt`, `--lrc`: choose output formats. If none are passed, JSON is written by default.
- `--json-output <path>`: override aligned JSON output path.
- `--srt-output <path>`: override SRT output path.
- `--lrc-output <path>`: override LRC output path.
- `--approx-output <path>`: override approximate WhisperX segment JSON path.
- `--audio-input-key <name>`: force the Replicate model audio input key if schema detection is wrong.
- `--model-input-json '{"language":"en"}'`: pass extra model inputs.
- `--keep-section-labels`: keep lines like `[Verse 1]` instead of skipping them.
- `--no-normalize-contractions`: disable contraction normalization.

## WhisperX Model / Device Note

`dashed/whisperx-subtitles-replicate` runs on Replicate infrastructure, so WhisperX model/device execution is remote (GPU/CPU selection is controlled by Replicate).
If the model exposes runtime knobs (for example language hints), pass them via `--model-input-json`.

## Alignment Stages

`scripts/align.js` is split into clear stages:

1. Transcription / alignment:
- Upload audio and run Replicate WhisperX model.
- Save raw approximate segments to `assets/approximate-lyric-segmentation.json`.

2. Text normalization:
- Lowercase, punctuation stripping, apostrophe normalization, whitespace cleanup.
- Optional contraction normalization.

3. Sequence matching:
- Flatten lyric words across lines.
- Align recognized words to lyric words using dynamic-programming sequence alignment with fuzzy substitutions.
- Ignore WhisperX segment boundaries.

4. Timestamp reconstruction:
- Use matched word timestamps directly.
- Interpolate missing words between anchors.
- Infer near start/end with conservative padding.
- Enforce monotonic timings.

5. Output formatting:
- Build per-line timing JSON with per-word timings.
- Optionally write SRT and LRC.

## Fallback Behavior

If alignment quality is poor (for example many unmatched words), the script logs warnings and switches to conservative timing estimation:

- Low-confidence line blocks are redistributed using nearby anchor lines.
- If global match quality is very low, all lines are proportionally redistributed over detected timeline range.

This guarantees usable output files even when ASR quality is noisy.
