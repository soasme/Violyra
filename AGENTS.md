# AGENTS.md — Violyra Golden Principles

This file is the authoritative reference for any AI coding agent working on the violyra repository. Read it before making any changes.

## Skill Naming Convention

Skill directory names and `name` frontmatter fields must follow the `gerund-object` pattern:

    gerund-noun(-modifier)*

Examples: `writing-video-plan`, `generating-actor-pack`, `using-replicate-model`

Regex: `/^[a-z]+-[a-z0-9]+(-[a-z0-9]+)*$/`

## Skill File Requirements

Every `skills/<skill-name>/SKILL.md` must:

- Start with valid YAML frontmatter containing `name` and `description`
- Have a `description` field of ≤ 200 characters
- Have a `name` field that matches the directory name exactly
- End with a `## Logging` section (see `skills/lib/logging-guide.md`)

**Frontmatter constraints:**
- Values must be unquoted plain scalars (e.g., `name: writing-video-plan`, not `name: "writing-video-plan"`). The linter's YAML parser does not support quoted values or block scalars.
- The `## Logging` section must not contain any sub-sections (`###` headings or deeper). It is a terminal flat section.

## Script Requirements

Every script added to `skills/<skill-name>/scripts/` must:

- Have a `__test__.js` companion in the same directory
- Keep logic in exported, reusable functions
- Put side effects (file I/O, process.exit, API calls) only in `main()`
- Support `--help` output describing available flags

No LLM API calls in scripts. Scripts handle file I/O and validation only.

**Exemptions from `__test__.js` requirement:**

- Browser-companion `helper.js` files — these run inside a `<script>` tag in the browser and cannot be imported by Node. Document the exemption with a comment at the top of the file: `// Browser-only — not testable with __test__.js`.
- Shell scripts (`.sh`) — not importable by Node.
- HTML template files (`.html`) — not importable by Node.

`.cjs` / `.js` files that export functions must have a `__test__.js` companion.

## Before Committing

Run both of these and confirm they pass:

```bash
pnpm test
pnpm lint-skills
```

Do not commit if either fails.

## Environment Variables

All scripts that need environment variables (e.g., `REPLICATE_API_TOKEN`, `FAL_KEY`) read from `.env`. Always load with:

```bash
source .env && node skills/<skill-name>/scripts/<action>.js
```

Never hard-code tokens or API keys.
