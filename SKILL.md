# Violyra

Violyra is a skill repository for music video production. It provides composable agent skills for generating scenes, writing storyboards, aligning lyrics, compiling final videos, and more.

## Skills

- [Seedance15 Generate](skills/seedance15-generate/SKILL.md): generate storyboard scene videos with Replicate `bytedance/seedance-1.5-pro`.
- [Seedance15 Prompt Writer](skills/seedance15-prompt-writer/SKILL.md): write motion-focused Seedance prompts for text-to-video and image-to-video.
- [MV Storyboard Writer](skills/mv-storyboard-writer/SKILL.md): write lyric-driven music video storyboard scenes from lyrics, style, and user requirements.
- [MV Compilation](skills/mv-compilation/SKILL.md): compile scene clips into a full-song MV with ffmpeg using optional auto-upscale, lyric-timing stretch, frame-fit, concat, and song audio mux.
- [Lyrics Force Alignment](skills/lyrics-force-alignment/SKILL.md): align ground-truth lyric lines to audio using Replicate WhisperX word timestamps.
- [Text To Speech](skills/text-to-speech/SKILL.md): generate narration audio, then clean and normalize it for delivery-ready video voiceover.
- [Video Upscale](skills/video-upscale/SKILL.md): upscale scene clips with Replicate `topazlabs/video-upscale`.
- [Transparent Image](skills/transparent-image/SKILL.md): extract foreground objects from images and produce transparent PNG cutouts.
- [YouTube Thumbnail Generator](skills/youtube-thumbnail-generator/SKILL.md): generate YouTube thumbnail images with Replicate `google/nano-banana-pro`.
- [Download YouTube Video](skills/download-youtube-video/SKILL.md): download a YouTube URL to local files using `uvx yt-dlp`.
- [Replicate](skills/replicate/SKILL.md): discover and run Replicate models through API-first workflow.

## Notes

- Always run `pnpm exec dotenv -- <command>` to load environment variables from `.env` before executing any command.
- Scripts are CLI-first: support flags, defaults, and `--help`.
- Add or update tests whenever you add or change script behavior.
- Keep script logic in reusable functions and side effects in `main()`.
- The `packages/app/` directory contains a Next.js asset explorer for reviewing generated media.
