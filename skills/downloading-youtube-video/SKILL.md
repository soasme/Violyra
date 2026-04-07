---
name: downloading-youtube-video
description: Download YouTube videos to local files with uvx yt-dlp. Use when asked to save a YouTube URL as local media, choose output directory or filename, handle JS challenges, or export audio-only files.
---

# Download YouTube Video

Use `uvx yt-dlp` so downloads run without a global `yt-dlp` installation.
For YouTube links, default to Node runtime + remote EJS components to avoid false "video not available" failures.

Run commands from `<project-dir>` so downloads land under the project's own `assets/` tree.

## Recommended Default Command

Use this command first for YouTube URLs:
`uvx yt-dlp --js-runtimes node --remote-components ejs:github -P assets/videos/downloads -o "%(title)s [%(id)s].%(ext)s" "<youtube-url>"`

## Workflow

1. Create output directory:
`mkdir -p assets/videos/downloads`

2. Download with the default command:
`uvx yt-dlp --js-runtimes node --remote-components ejs:github -P assets/videos/downloads -o "%(title)s [%(id)s].%(ext)s" "https://www.youtube.com/watch?v=pZ7H3XuEFkQ"`

3. Prefer MP4 output for combined video + audio:
`uvx yt-dlp --js-runtimes node --remote-components ejs:github -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b" --merge-output-format mp4 -P assets/videos/downloads -o "%(title)s [%(id)s].%(ext)s" "https://www.youtube.com/watch?v=pZ7H3XuEFkQ"`

## Audio Only

Extract and convert to MP3:
`uvx yt-dlp --js-runtimes node --remote-components ejs:github -x --audio-format mp3 -P assets/audios/downloads -o "%(title)s [%(id)s].%(ext)s" "https://www.youtube.com/watch?v=pZ7H3XuEFkQ"`

## Authentication Fallback

Pass browser cookies when a URL requires login or age verification:
`uvx yt-dlp --js-runtimes node --remote-components ejs:github --cookies-from-browser chrome -P assets/videos/downloads -o "%(title)s [%(id)s].%(ext)s" "https://www.youtube.com/watch?v=pZ7H3XuEFkQ"`

## Troubleshooting

- If output shows `No supported JavaScript runtime could be found`, add `--js-runtimes node`.
- If output shows `This video is not available` for a known-working URL, retry with `--remote-components ejs:github`.
- If the video is age-restricted or login-gated, add `--cookies-from-browser <browser>` (for example `chrome`).

## Output Contract

- Save downloaded files locally in the selected directory.
- Preserve original extension unless `--merge-output-format` or `--audio-format` is set.
- Print the final local path in terminal output.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `url`, `output_dir`, `format` (`video`/`audio`/`both`)
**On completion** — key `outputs`: `video_path`, `audio_path`, `duration_s`
