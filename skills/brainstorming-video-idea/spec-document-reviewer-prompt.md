# Video Idea Spec — Document Reviewer Prompt

Review the written `SPEC.md`, focusing on the `# Idea` section. Check each item below. Fix any issues inline without re-reviewing. Only block when the written spec would cause the next planning step to build the wrong thing.

## Checklist

### Audience and Tone
- [ ] Platform is named (YouTube MV, Shorts, TikTok, etc.)
- [ ] Duration or target length is specified
- [ ] Tone is concrete — not just "good vibes" but something actionable like "high-energy anime chase, warm color palette"
- [ ] No audience/tone contradiction (e.g., "family-friendly" and "dark horror imagery" in the same spec)

### Characters and Continuity
- [ ] Every named character has at least: name, role, 2+ visual traits
- [ ] Characters appearing in 3+ scenes have a continuity method specified (reference images, start frames, or documented exception)
- [ ] No character described in the scene progression that is not listed in the Characters table
- [ ] If no characters: spec explicitly says "no recurring characters"

### Music and Lyrics
- [ ] Source audio status is clear (file path exists, or will be generated with parameters)
- [ ] Sung-line count is stated
- [ ] Non-sung lines (section headers, decorations) are identified so the pipeline can exclude them
- [ ] Lyric-to-scene ratio is stated (e.g., "2 lines per scene")

### Scene Progression
- [ ] Section labels match the song structure (intro, verse, chorus, bridge, outro — or justify deviation)
- [ ] Scene count is consistent with lyric-to-scene ratio and sung-line count
- [ ] No scene described without a section label
- [ ] Scene summaries are concrete enough to write a prompt from (not "a cool scene" or "something dramatic")

### Production Feasibility
- [ ] Reference-image decision is explicit (yes/no per character)
- [ ] Any known model constraints are stated (resolution, duration limits, safe-for-platform requirements)
- [ ] No unbounded scope that would spawn multiple independent productions (one song, one video)

### Project Seeds
- [ ] `seed` is an integer (not a string, not empty)
- [ ] `style` description is present and specific
- [ ] `defaultModel` is set (default: `"bytedance/seedance-1.5-pro"`)
- [ ] `fps` and `resolution` are set

## Approval Bar

Pass if all required fields are present and internally consistent. Minor style or phrasing issues do not block. Block only if:
- A required field is missing or contradictory in a way that would make planning ambiguous
- The spec scope spans more than one distinct song/video (needs decomposition)
- Character continuity is unresolved for a character appearing in 3+ scenes
