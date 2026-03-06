# Vima
Vima is Video Making Agent, powered by pi-coding-agent.

Notes:

- Always run `pnpm exec dotenv -- <command>` to ensure environment variables are loaded from `.env` before executing any command.


List of skills:

- [Seedance15 Generate](.agents/skills/seedance15-generate/SKILL.md): generate storyboard scene videos with Replicate `bytedance/seedance-1.5-pro` and save `assets/scenes/<scene_id>.mp4`.
- [Seedance15 Prompt Writer](.agents/skills/seedance15-prompt-writer/SKILL.md): write motion-focused Seedance prompts for text-to-video and image-to-video.
- [Replicate](.agents/skills/replicate/SKILL.md): discover and run Replicate models through API-first workflow.
- [YouTube Thumbnail Generator](.agents/skills/youtube-thumbnail-generator/SKILL.md): generate YouTube thumbnail images with Replicate `google/nano-banana-pro` from prompts and optional reference images.
- [Transparent Image](.agents/skills/transparent-image/SKILL.md): extract foreground objects from images and produce transparent PNG cutouts.
- [Text To Speech](.agents/skills/text-to-speech/SKILL.md): generate narration audio, then clean and normalize it for delivery-ready video voiceover.
- [MV Storyboard Writer](.agents/skills/mv-storyboard-writer/SKILL.md): write lyric-driven music video storyboard scenes from lyrics, style, and user requirements.
