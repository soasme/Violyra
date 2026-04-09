---
name: generating-lyrics
description: Use when writing or refining song lyrics for a music video. Produces lyrics.txt with verse/chorus/bridge markers before audio generation.
---

# Generating Lyrics

Writes or refines song lyrics through collaborative dialogue. Output is `lyrics.txt` with structural markers for downstream audio alignment.

## Inputs

- Topic/theme
- Mood and genre
- Language
- Target duration (minutes)
- Optional: reference lyrics or existing draft at `<chapter-dir>/lyrics.txt`

## Workflow

1. Gather inputs from user (or infer from the `# Idea` section of `<base-dir>/SPEC.md`)
2. Draft lyrics section by section: `[Verse 1]`, `[Chorus]`, `[Verse 2]`, `[Bridge]`, etc.
3. Present one section at a time to user for feedback
4. Iterate until each section is approved
5. Write final lyrics to `<chapter-dir>/lyrics.txt` with structural markers

## Output Format

```
[Verse 1]
<line 1>
<line 2>
...

[Chorus]
<line 1>
...

[Bridge]
...
```

## Output

- `<chapter-dir>/lyrics.txt`

## After Approval

Transition to `generating-song`.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `theme`, `style`, `structure` (verse/chorus/bridge counts)
**On completion** — key `outputs`: `lyrics_path`, `line_count`
