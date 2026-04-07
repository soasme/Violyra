# Video Production Plan — Document Reviewer Prompt

Review `video-plan.md` and `production-plan.json` after they are written. Fix any issues inline. Only block when the plan would cause an agent to execute the wrong thing or get stuck unnecessarily.

## Checklist

### Completeness
- [ ] All 13 phases are present in `video-plan.md` (project-setup through delivery)
- [ ] Each phase in `video-plan.md` has: skill name, requires list, produces list, verification criteria, status
- [ ] `production-plan.json` phase list matches `video-plan.md` phase list exactly (same IDs, same order)
- [ ] No phase says "TBD", "to be determined", or "as needed"

### Alignment with `video-idea.md`
- [ ] Storyboard scene count matches the scene count implied by the lyric-to-scene ratio in `video-idea.md`
- [ ] Characters listed in `video-plan.md` match `video-idea.md` Characters table
- [ ] Reference-image phase is marked required/optional consistently with `video-idea.md`
- [ ] Song file path in plan matches what `video-idea.md` specifies

### Phase Ordering and Dependencies
- [ ] `source-assets` phase precedes `production-pipeline`
- [ ] `production-pipeline` precedes `reference-images` and `video-prompts`
- [ ] `scene-generation` precedes `draft-compile`
- [ ] `draft-compile` precedes `retention-review`
- [ ] `retention-review` precedes `recompile`
- [ ] `recompile` precedes `video-review`
- [ ] `video-review` precedes `thumbnail` and `delivery`

### Buildability
- [ ] Every `requires` artifact in `production-plan.json` can be traced to a `produces` in a prior phase (or is a user-supplied input)
- [ ] No phase requires an artifact that no prior phase produces (no phantom dependencies)
- [ ] Status fields in `production-plan.json` reflect actual workspace state (completed phases are marked completed)

### Scene Count Consistency
- [ ] Storyboard scene count stated in `video-plan.md` matches actual scene count in `storyboard.json`
- [ ] Verification criteria in `video-plan.md` reference the exact scene count (no "n scenes" placeholder left unfilled)

### Reference-Image Phase
- [ ] Phase 5 is explicitly marked `*(required)*` or `*(optional)*`
- [ ] If required: the characters needing reference images are named
- [ ] If optional: a reason is stated (e.g., "no recurring characters" or "abstract visual style")

### Retention and Review Placement
- [ ] `retention-driven-development` appears after `draft-compile` and before `recompile`
- [ ] `requesting-video-review` appears after `recompile` and before `delivery`

## Approval Bar

Pass if all required fields are present, phase order is correct, and the plan is internally consistent. Minor style issues do not block. Block if:
- Any phase is missing from `video-plan.md` or `production-plan.json`
- A `requires` artifact has no prior `produces` source
- Retention or review phases are out of order or missing
- Scene count placeholders are unfilled
