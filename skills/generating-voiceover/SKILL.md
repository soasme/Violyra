---
name: generating-voiceover
description: Produce clean, consistent, delivery-ready TTS audio for video tasks. Use when asked to generate narration or voiceover, choose a local or cloud TTS engine, clean artifacts, normalize loudness, and export segment-ready audio files.
---

# Generate Voiceover

Choose engine by need:

1. Prototyping: use `espeak-ng` for fast local iteration.
2. Cloud: use `scripts/chatterbox_tts.js` for Replicate Chatterbox.

Processing goals:

1. Keep narration intelligible and free of low-end rumble and digital fizz.
2. Keep tonal balance and loudness consistent across all segments in one video.
3. Avoid boundary clicks/pops with short fades on every cut.
4. Export a delivery-ready file that matches project specs.

Recommended workflow:

1. Generate raw TTS first. Do not normalize at this stage.
2. Split or assemble segments by sentence/phrase boundaries, then apply the same cleanup chain to every segment.
3. Do timing edits (trim, pacing, alignment) before final loudness normalization.
4. Normalize loudness as the final audio-processing step.
5. Export to the project target format and run a final listening pass.

Engine selection guidance:

1. Use `espeak-ng` for drafts, timing tests, and rapid iteration where quality is less important.
2. Use Chatterbox for cloud-quality output when naturalness and delivery quality matter.
3. Use `--audio-ref` in Chatterbox when you need style/voice steering; omit it for generic delivery.

Prototyping example:
`espeak-ng -v en-us -s 165 -w draft.wav "Your script text"`

Cloud example (requires `REPLICATE_API_TOKEN`):
`REPLICATE_API_TOKEN=<token> node .agents/skills/generating-voiceover/scripts/chatterbox_tts.js --prompt "Your script text" --output narration.wav --audio-ref ref.wav`

Cleanup guidance:

1. Always high-pass around 20 Hz to remove DC/rumble.
2. Apply low-pass around 16 kHz only when top-end fizz/harshness is audible.
3. Add short fade-in/out (~50 ms) at clip edges to prevent clicks and pops.
4. Keep one consistent filter chain across all segments to avoid tonal mismatch.

Use consistent cleanup filters across all segments. Recommended FFmpeg chain:
`ffmpeg -y -i raw.wav -af "highpass=f=20,lowpass=f=16000,afade=t=in:st=0:d=0.05,areverse,afade=t=in:st=0:d=0.05,areverse" cleaned.wav`

If low-pass is not needed, remove `lowpass=f=16000`.

Loudness guidance (BS.1770 / EBU R128 style):

1. Measure first, then normalize.
2. Use integrated loudness target `-23 LUFS`, true peak around `-1.5 dBTP`, and optional `LRA=11`.
3. Re-normalize if any later tempo/stretch/timing edit changes the signal.

Measure loudness (EBU R128 / BS.1770 style):
`ffmpeg -hide_banner -i cleaned.wav -filter_complex ebur128 -f null -`

Normalize as the final step:
`ffmpeg -y -i cleaned.wav -af "loudnorm=I=-23:TP=-1.5:LRA=11:print_format=summary" normalized.wav`

Export delivery format (typical video-ready WAV):
`ffmpeg -y -i normalized.wav -ar 48000 -ac 1 -c:a pcm_s16le delivery.wav`

Final QC checklist:

1. No audible clicks at segment starts/ends.
2. No clipping on peaks and no unexpected pumping/breathing.
3. Speech remains clear on small speakers and headphones.
4. All segments sound like the same voice in the same acoustic space.

If tempo or duration changes happen after normalization, run normalization again.
