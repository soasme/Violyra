# Vima
Vima is Video Making Agent, powered by pi-coding-agent.

Notes:

- Always run `dotenv -- <command>` to ensure environment variables are loaded from `.env` before executing any command.


List of skills:

- [Transparent Image](.agent/skills/transparent-image/SKILL.md): extract foreground objects from images and produce transparent PNG cutouts.
- [Text To Speech](.agent/skills/text-to-speech/SKILL.md): generate narration audio, then clean and normalize it for delivery-ready video voiceover.
