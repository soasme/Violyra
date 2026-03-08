# Vima
Vima is Video Making Agent, powered by pi-coding-agent.

Notes:

- Always run `pnpm exec dotenv -- <command>` to ensure environment variables are loaded from `.env` before executing any command.
- Script work should be CLI-first: support flags, defaults, and `--help`.
- Add or update tests whenever you add or change script behavior.
- Keep script logic in reusable functions and keep side effects in `main()`.


List of skills:

- [Seedance15 Generate](.agents/skills/seedance15-generate/SKILL.md): generate storyboard scene videos with Replicate `bytedance/seedance-1.5-pro` and save `assets/scenes/<scene_id>.mp4`.
- [Seedance15 Prompt Writer](.agents/skills/seedance15-prompt-writer/SKILL.md): write motion-focused Seedance prompts for text-to-video and image-to-video.
- [Replicate](.agents/skills/replicate/SKILL.md): discover and run Replicate models through API-first workflow.
- [Download YouTube Video](.agents/skills/download-youtube-video/SKILL.md): download a YouTube URL to local files using `uvx yt-dlp`.
- [YouTube Thumbnail Generator](.agents/skills/youtube-thumbnail-generator/SKILL.md): generate YouTube thumbnail images with Replicate `google/nano-banana-pro` from prompts and optional reference images.
- [Transparent Image](.agents/skills/transparent-image/SKILL.md): extract foreground objects from images and produce transparent PNG cutouts.
- [Text To Speech](.agents/skills/text-to-speech/SKILL.md): generate narration audio, then clean and normalize it for delivery-ready video voiceover.
- [MV Storyboard Writer](.agents/skills/mv-storyboard-writer/SKILL.md): write lyric-driven music video storyboard scenes from lyrics, style, and user requirements.
- [Lyrics Force Alignment](.agents/skills/lyrics-force-alignment/SKILL.md): align ground-truth lyric lines to audio using Replicate WhisperX word timestamps, then output aligned JSON and optional SRT/LRC.
- [Video Upscale](.agents/skills/video-upscale/SKILL.md): upscale scene clips with Replicate `topazlabs/video-upscale`.
- [MV Compilation](.agents/skills/mv-compilation/SKILL.md): compile scene clips into a full-song MV with ffmpeg using optional auto-upscale, lyric-timing stretch, frame-fit, concat, and song audio mux.
- App has its own skills under `packages/app/.agents/skills/`. These skills are focused on enhancing feature development and maintenance for the app in this moni repo.
