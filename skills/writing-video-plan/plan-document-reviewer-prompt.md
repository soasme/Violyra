# Project Spec and Plan — Document Reviewer Prompt

Review `SPEC.md` and `docs/plan.md` after they are written. Fix any issues inline. Only block when the spec or plan would cause an agent to execute the wrong thing or get stuck unnecessarily.

## Checklist

### Spec Completeness
- [ ] `SPEC.md` names the source idea doc and current status
- [ ] Project contract fields are present: goal, platform, duration, default model, fps, resolution
- [ ] Required assets are listed with exact paths or clearly marked gaps
- [ ] Asset directories are listed in Markdown under `## Asset Directories`
- [ ] Characters and continuity requirements are captured if the project has recurring characters
- [ ] Chapter or scene structure is concrete enough to plan from
- [ ] No placeholder text like `TBD`, `fill later`, or `something here`

### Markdown-First Contract
- [ ] `SPEC.md` keeps project structure in text instead of assuming `global/`, `characters/`, or `chapters/` directories
- [ ] Project defaults are expressed as Markdown paragraphs or lists, not a separate JSON config requirement
- [ ] Any machine-readable snippet inside `SPEC.md` is wrapped in a fenced `json` code block
- [ ] No standalone JSON artifact is required unless a downstream script actually needs it now

### Alignment with `docs/idea.md`
- [ ] Assets, characters, and structure in `SPEC.md` match the approved idea doc
- [ ] Model, style, and seed assumptions do not contradict the approved idea doc
- [ ] If the idea doc marks an input required before planning, the plan reflects that dependency explicitly

### Plan Buildability
- [ ] `docs/plan.md` references `SPEC.md` and the real asset paths under `assets/`
- [ ] Tasks are separated clearly enough that an agent can tell spec work from asset work
- [ ] Every task has exact files, a concrete action, and a verification step
- [ ] Blockers and next step are explicit

### Execution Readiness
- [ ] The first incomplete task is actionable without guessing
- [ ] Optional storyboard export is treated as optional unless a downstream script needs it
- [ ] Nothing in the plan requires hidden repo knowledge outside `docs/idea.md`, `SPEC.md`, and the declared asset paths

## Approval Bar

Pass if `SPEC.md` and `docs/plan.md` are consistent, actionable, and Markdown-first. Minor phrasing issues do not block. Block if:
- `SPEC.md` is missing core project contract details
- `docs/plan.md` does not make the next actionable work clear
- The spec or plan still depends on implicit `global/`, `characters/`, or `chapters/` directories as the primary project contract
