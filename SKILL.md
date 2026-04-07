# Violyra

Violyra is a skill repository for music video production. It provides composable agent skills for planning runs, generating scenes, aligning lyrics, compiling final videos, and more.

## Skills

### Workflow
- [Brainstorming Video Idea](skills/brainstorming-video-idea/SKILL.md): refine a rough video idea through dialogue into the `# Idea` section of `<project-dir>/SPEC.md`.
- [Setup Video Project](skills/setup-video-project/SKILL.md): create workspace directories, preserve or scaffold `<project-dir>/SPEC.md`, create `<project-dir>/PLAN.md`, and prepare `<project-dir>/project/`.
- [Executing Video Plan](skills/executing-video-plan/SKILL.md): execute `<project-dir>/PLAN.md` against `<project-dir>/SPEC.md` task-by-task and keep `PLAN.md` current.
- [Retention-Driven Development](skills/retention-driven-development/SKILL.md): simulate 100 viewers per shot, score retention, regenerate weak shots. Replace, don't patch.
- [Requesting Video Review](skills/requesting-video-review/SKILL.md): review production progress against `<project-dir>/SPEC.md`, `<project-dir>/PLAN.md`, and project outputs by severity.

### Music Production
- [Generating Lyrics](skills/generating-lyrics/SKILL.md): write or refine song lyrics with verse/chorus/bridge markers before audio generation.
- [Generating Song](skills/generating-song/SKILL.md): compose a generation prompt from lyrics and style; validate the audio file once placed.
- [Aligning Lyrics](skills/aligning-lyrics/SKILL.md): align ground-truth lyric lines to audio using Replicate WhisperX word timestamps.

### Asset Management
- [Generating Actor Pack](skills/generating-actor-pack/SKILL.md): manage global actor appearance references (name, appearance text, reference images).
- [Generating Character Pack](skills/generating-character-pack/SKILL.md): manage project-scoped character compositions (actor + costume + props).
- [Generating Scene Pack](skills/generating-scene-pack/SKILL.md): manage global scene/environment references.
- [Generating Prop Pack](skills/generating-prop-pack/SKILL.md): manage global prop references.
- [Generating Costume Pack](skills/generating-costume-pack/SKILL.md): manage global costume references.
- [Prompt Template](skills/prompt-template/SKILL.md): manage reusable prompt templates with `{{variable}}` slots.

### Production Pipeline
- [Breaking Down Video Script](skills/breaking-down-video-script/SKILL.md): convert any raw text into an indexed shot list and chapter summary.
- [Extracting Video Entities](skills/extracting-video-entities/SKILL.md): populate actor, scene, prop, and costume packs from a shot list.
- [Enriching Shot Details](skills/enriching-shot-details/SKILL.md): enrich shots with cinematic parameters (framing, angle, movement, mood, frame prompts).
- [Checking Consistency](skills/checking-consistency/SKILL.md): detect character/scene drift across shots and produce a consistency report.
- [Running Video Production Pipeline](skills/running-video-production-pipeline/SKILL.md): orchestrate breaking-down → extracting → enriching → checking for a chapter.

### Video Generation
- [Writing Video Plan](skills/writing-video-plan/SKILL.md): refine `<project-dir>/SPEC.md`, then write `<project-dir>/PLAN.md`; export storyboard JSON only when needed.
- [Writing Seedance15 Prompt](skills/writing-seedance15-prompt/SKILL.md): write motion-focused Seedance prompts from shot details.
- [Generating Seedance15 Video](skills/generating-seedance15-video/SKILL.md): generate scene videos with Seedance 1.5 via Replicate.
- [Upscaling Video](skills/upscaling-video/SKILL.md): upscale scene clips with Topaz via Replicate.
- [Extracting Foreground](skills/extracting-foreground/SKILL.md): extract foreground objects from images and produce transparent PNG cutouts.
- [Generating Thumbnail](skills/generating-thumbnail/SKILL.md): generate video thumbnails via Replicate.

### Post-Production
- [Compiling Video](skills/compiling-video/SKILL.md): compile scene clips into a full music video with ffmpeg (stretch, fit, concat, audio mux).
- [Generating Voiceover](skills/generating-voiceover/SKILL.md): generate narration audio, then clean and normalize it for delivery-ready video voiceover.

### Full Pipeline
- [MV Production Pipeline](skills/mv-production-pipeline/SKILL.md): run the complete music video workflow from lyrics to final compiled video.
- [Shorts Production Pipeline](skills/shorts-production-pipeline/SKILL.md): run the complete short drama workflow from screenplay to final assembly.

### Utilities
- [Replicate](skills/replicate/SKILL.md): discover and run Replicate models through API-first workflow.
- [Downloading YouTube Video](skills/downloading-youtube-video/SKILL.md): download a YouTube URL to local files using `uvx yt-dlp`.

## Notes

- Run `source .env` (or `source ~/.config/violyra/.env`) before executing any script to load environment variables.
- Scripts are CLI-first: support flags, defaults, and `--help`.
- Add or update tests whenever you add or change script behavior.
- Keep script logic in reusable functions and side effects in `main()`.
- The `packages/app/` directory contains a Next.js asset explorer for reviewing generated media.
