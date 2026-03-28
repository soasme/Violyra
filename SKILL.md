# Violyra

Violyra is a skill repository for music video production. It provides composable agent skills for generating scenes, writing storyboards, aligning lyrics, compiling final videos, and more.

## Skills

- [Generating Seedance15 Video](skills/generating-seedance15-video/SKILL.md): generate storyboard scene videos with Replicate `bytedance/seedance-1.5-pro`.
- [Writing Seedance15 Prompt](skills/writing-seedance15-prompt/SKILL.md): write motion-focused Seedance prompts for text-to-video and image-to-video.
- [Writing Video Plan](skills/writing-video-plan/SKILL.md): write lyric-driven music video storyboard scenes from lyrics, style, and user requirements.
- [Compiling Video](skills/compiling-video/SKILL.md): compile scene clips into a full-song MV with ffmpeg using optional auto-upscale, lyric-timing stretch, frame-fit, concat, and song audio mux.
- [Aligning Lyrics](skills/aligning-lyrics/SKILL.md): align ground-truth lyric lines to audio using Replicate WhisperX word timestamps.
- [Generating Voiceover](skills/generating-voiceover/SKILL.md): generate narration audio, then clean and normalize it for delivery-ready video voiceover.
- [Upscaling Video](skills/upscaling-video/SKILL.md): upscale scene clips with Replicate `topazlabs/video-upscale`.
- [Extracting Foreground](skills/extracting-foreground/SKILL.md): extract foreground objects from images and produce transparent PNG cutouts.
- [Generating Thumbnail](skills/generating-thumbnail/SKILL.md): generate YouTube thumbnail images with Replicate `google/nano-banana-pro`.
- [Downloading YouTube Video](skills/downloading-youtube-video/SKILL.md): download a YouTube URL to local files using `uvx yt-dlp`.
- [Replicate](skills/replicate/SKILL.md): discover and run Replicate models through API-first workflow.

## Notes

- Run `source .env` (or `source ~/.config/violyra/.env`) before executing any script to load environment variables.
- Scripts are CLI-first: support flags, defaults, and `--help`.
- Add or update tests whenever you add or change script behavior.
- Keep script logic in reusable functions and side effects in `main()`.
- The `packages/app/` directory contains a Next.js asset explorer for reviewing generated media.
