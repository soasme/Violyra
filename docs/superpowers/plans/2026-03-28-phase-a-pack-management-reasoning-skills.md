# Phase A: Pack Management & Reasoning Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 6 pack management skills, 4 reasoning skill validators, and the production-pipeline orchestrator; fix the broken test runner and 4 broken README links.

**Architecture:** A shared `skills/lib/pack-utils.js` handles ID generation, JSON I/O, and error output for all 6 pack scripts. Each pack script exposes create/read/update/delete/list via `node:util` parseArgs. Reasoning skills add JSON schema validators. All ESM. Vitest for tests.

**Tech Stack:** Node.js 20+ (ESM), Vitest 3, `node:fs`, `node:path`, `node:util` (parseArgs), pnpm

**Parallelism:**
- Tasks 0–2: sequential prerequisites
- Tasks 3–8: parallel (Wave 1 — pack skills, independent)
- Tasks 9–12: parallel after Wave 1 (Wave 2 — reasoning validators)
- Task 13: after Wave 2 (production-pipeline)

---

## File Map

**Create:**
- `vitest.config.js` (fix: CJS → ESM)
- `skills/lib/pack-utils.js` + `skills/lib/pack-utils.__test__.js`
- `skills/generating-actor-pack/SKILL.md` + `scripts/actor-pack.js` + `scripts/actor-pack.__test__.js`
- `skills/generating-scene-pack/SKILL.md` + `scripts/scene-pack.js` + `scripts/scene-pack.__test__.js`
- `skills/generating-prop-pack/SKILL.md` + `scripts/prop-pack.js` + `scripts/prop-pack.__test__.js`
- `skills/generating-costume-pack/SKILL.md` + `scripts/costume-pack.js` + `scripts/costume-pack.__test__.js`
- `skills/generating-character-pack/SKILL.md` + `scripts/character-pack.js` + `scripts/character-pack.__test__.js`
- `skills/prompt-template/SKILL.md` + `scripts/prompt-template.js` + `scripts/prompt-template.__test__.js`
- `skills/script-breakdown/SKILL.md` + `scripts/validate-shot-list.js` + `scripts/validate-shot-list.__test__.js`
- `skills/entity-extraction/SKILL.md` + `scripts/validate-extraction-report.js` + `scripts/validate-extraction-report.__test__.js`
- `skills/shot-detail/SKILL.md` + `scripts/validate-shot-details.js` + `scripts/validate-shot-details.__test__.js`
- `skills/consistency-check/SKILL.md` + `scripts/validate-consistency-report.js` + `scripts/validate-consistency-report.__test__.js`
- `skills/production-pipeline/SKILL.md` + `references/workflow.md`

**Modify:**
- `vitest.config.js` (CJS → ESM)
- `README.md` (fix 4 broken skill links)

---

## Task 0: Fix vitest.config.js

**Files:**
- Modify: `vitest.config.js`

- [ ] **Overwrite vitest.config.js with ESM syntax**

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      '**/*.{test,spec}.?(c|m)[jt]s?(x)',
      '**/*.__test__.?(c|m)[jt]s?(x)',
    ],
    exclude: [
      '**/node_modules/**',
      '**/packages/**',
    ],
  },
})
```

- [ ] **Verify test runner loads**

```bash
pnpm exec vitest run --reporter=verbose 2>&1 | head -5
```

Expected: no "Dynamic require" error. May show "No test files found" — that's fine.

- [ ] **Commit**

```bash
git add vitest.config.js
git commit -m "fix: convert vitest.config.js to ESM"
```

---

## Task 1: Fix README broken links

**Files:**
- Modify: `README.md`

- [ ] **Fix the 4 broken skill links in README.md**

Find and replace these 4 lines:

| Find | Replace |
|---|---|
| `[Text To Speech](skills/text-to-speech/SKILL.md)` | `[Generate Voiceover](skills/generate-voiceover/SKILL.md)` |
| `[Video Upscale](skills/video-upscale/SKILL.md)` | `[Upscale Video](skills/upscale-video/SKILL.md)` |
| `[Transparent Image](skills/transparent-image/SKILL.md)` | `[Extract Foreground](skills/extract-foreground/SKILL.md)` |
| `[YouTube Thumbnail Generator](skills/youtube-thumbnail-generator/SKILL.md)` | `[Generate Thumbnail](skills/generate-thumbnail/SKILL.md)` |

- [ ] **Verify links resolve**

```bash
for f in skills/generate-voiceover/SKILL.md skills/upscale-video/SKILL.md skills/extract-foreground/SKILL.md skills/generate-thumbnail/SKILL.md; do [ -f "$f" ] && echo "OK: $f" || echo "MISSING: $f"; done
```

Expected: all four print `OK`.

- [ ] **Commit**

```bash
git add README.md
git commit -m "fix: correct 4 broken README skill links"
```

---

## Task 2: Create skills/lib/pack-utils.js

**Files:**
- Create: `skills/lib/pack-utils.js`
- Create: `skills/lib/pack-utils.__test__.js`

- [ ] **Write the failing test**

```javascript
// skills/lib/pack-utils.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  SCHEMA_VERSION,
  generateId,
  readPack,
  writePack,
  listPacksInDir,
} from './pack-utils.js'

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'pack-utils-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

describe('SCHEMA_VERSION', () => {
  it('is 1.0', () => { expect(SCHEMA_VERSION).toBe('1.0') })
})

describe('generateId', () => {
  it('returns prefix_base36timestamp', () => {
    const id = generateId('actor')
    expect(id).toMatch(/^actor_[0-9a-z]+$/)
  })
  it('generates unique ids', () => {
    const ids = Array.from({ length: 10 }, () => generateId('x'))
    expect(new Set(ids).size).toBe(10)
  })
})

describe('writePack / readPack', () => {
  it('round-trips a pack', () => {
    const path = join(tmpDir, 'sub', 'pack.json')
    const data = { $schemaVersion: '1.0', id: 'actor_abc', name: 'Mia' }
    writePack(path, data)
    const loaded = readPack(path)
    expect(loaded.name).toBe('Mia')
  })
  it('throws on unknown schemaVersion', () => {
    const path = join(tmpDir, 'pack.json')
    writePack(path, { $schemaVersion: '99.0', id: 'x' })
    expect(() => readPack(path)).toThrow('Unknown schemaVersion')
  })
  it('throws when file does not exist', () => {
    expect(() => readPack(join(tmpDir, 'missing.json'))).toThrow('not found')
  })
})

describe('listPacksInDir', () => {
  it('returns empty array when dir does not exist', () => {
    expect(listPacksInDir(join(tmpDir, 'nonexistent'))).toEqual([])
  })
  it('lists pack.json files from subdirectories', () => {
    writePack(join(tmpDir, 'actor_a', 'pack.json'), { $schemaVersion: '1.0', id: 'actor_a', name: 'A' })
    writePack(join(tmpDir, 'actor_b', 'pack.json'), { $schemaVersion: '1.0', id: 'actor_b', name: 'B' })
    const packs = listPacksInDir(tmpDir)
    expect(packs).toHaveLength(2)
    expect(packs.map(p => p.name).sort()).toEqual(['A', 'B'])
  })
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm exec vitest run skills/lib/pack-utils.__test__.js
```

Expected: FAIL — `pack-utils.js` does not exist.

- [ ] **Write the implementation**

```javascript
// skills/lib/pack-utils.js
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

export const SCHEMA_VERSION = '1.0'

let _lastMs = 0
let _idCounter = 0

export function generateId(prefix) {
  const ms = Date.now()
  if (ms === _lastMs) {
    _idCounter++
  } else {
    _lastMs = ms
    _idCounter = 0
  }
  const ts = ms.toString(36)
  return _idCounter === 0 ? `${prefix}_${ts}` : `${prefix}_${ts}_${_idCounter}`
}

export function readPack(filePath) {
  if (!existsSync(filePath)) throw new Error(`Pack not found: ${filePath}`)
  const data = JSON.parse(readFileSync(filePath, 'utf8'))
  if (data.$schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unknown schemaVersion: ${data.$schemaVersion}`)
  }
  return data
}

export function writePack(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

export function errorExit(msg) {
  process.stderr.write(JSON.stringify({ error: msg }) + '\n')
  process.exit(1)
}

export function successOutput(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n')
}

export function listPacksInDir(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(e => {
      const packPath = join(dir, e.name, 'pack.json')
      if (!existsSync(packPath)) return []
      try { return [JSON.parse(readFileSync(packPath, 'utf8'))] }
      catch { return [] }
    })
}
```

- [ ] **Run test to verify it passes**

```bash
pnpm exec vitest run skills/lib/pack-utils.__test__.js
```

Expected: all tests PASS.

- [ ] **Commit**

```bash
git add skills/lib/pack-utils.js skills/lib/pack-utils.__test__.js
git commit -m "feat: add shared pack-utils library"
```

---

## Task 3: generating-actor-pack

**Files:**
- Create: `skills/generating-actor-pack/SKILL.md`
- Create: `skills/generating-actor-pack/scripts/actor-pack.js`
- Create: `skills/generating-actor-pack/scripts/actor-pack.__test__.js`

- [ ] **Write SKILL.md**

```markdown
---
name: generating-actor-pack
description: Use when creating, reading, updating, deleting, or listing global actor appearance references. Actors are reusable across projects.
---

# Generating Actor Pack

Manages global physical appearance references for performers. An actor pack captures the "look" — appearance text, reference images — independent of any project role or costume. Always create an actor pack before referencing a performer in any shot.

## Subcommands

```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js <subcommand> [options]
```

### create
```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js create \
  --base-dir assets/ --name "Mia" \
  --appearance "short black hair, slim build, ~20s, distinctive freckles" \
  --description "Lead performer" --tags '["lead","female"]'
```
Returns the created pack JSON. File: `<base-dir>/global/actors/<id>/pack.json`.

### read
```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js read \
  --base-dir assets/ --id actor_lz4x7
```

### update
```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js update \
  --base-dir assets/ --id actor_lz4x7 --appearance "short black hair, updated"
```

### delete
```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js delete \
  --base-dir assets/ --id actor_lz4x7
```

### list
```bash
pnpm exec dotenv -- node skills/generating-actor-pack/scripts/actor-pack.js list \
  --base-dir assets/ [--filter mia]
```

## Schema

See `docs/design-docs/2026-03-27-production-pipeline-design.md` for the full `global/actors/<id>/pack.json` schema.
```

- [ ] **Write the failing test**

```javascript
// skills/generating-actor-pack/scripts/actor-pack.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/generating-actor-pack/scripts/actor-pack.js'

function run(...args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' })
}

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'actor-pack-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

describe('actor-pack create', () => {
  it('creates a pack and returns JSON', () => {
    const r = run('create', '--base-dir', tmpDir, '--name', 'Mia', '--appearance', 'short black hair')
    expect(r.status).toBe(0)
    const pack = JSON.parse(r.stdout)
    expect(pack.id).toMatch(/^actor_/)
    expect(pack.name).toBe('Mia')
    expect(pack.appearance).toBe('short black hair')
    expect(pack.$schemaVersion).toBe('1.0')
    expect(pack.images).toEqual([])
    expect(pack.createdAt).toBeTruthy()
  })
  it('exits 1 when --name is missing', () => {
    const r = run('create', '--base-dir', tmpDir)
    expect(r.status).toBe(1)
    expect(JSON.parse(r.stderr).error).toContain('--name')
  })
  it('exits 1 when --base-dir is missing', () => {
    const r = run('create', '--name', 'Mia')
    expect(r.status).toBe(1)
  })
})

describe('actor-pack read', () => {
  it('reads a created pack', () => {
    const created = JSON.parse(run('create', '--base-dir', tmpDir, '--name', 'Mia').stdout)
    const r = run('read', '--base-dir', tmpDir, '--id', created.id)
    expect(r.status).toBe(0)
    expect(JSON.parse(r.stdout).name).toBe('Mia')
  })
  it('exits 1 for unknown id', () => {
    const r = run('read', '--base-dir', tmpDir, '--id', 'actor_notexist')
    expect(r.status).toBe(1)
  })
})

describe('actor-pack update', () => {
  it('updates fields and preserves others', () => {
    const created = JSON.parse(run('create', '--base-dir', tmpDir, '--name', 'Mia', '--description', 'Lead').stdout)
    const r = run('update', '--base-dir', tmpDir, '--id', created.id, '--name', 'Mia Updated')
    expect(r.status).toBe(0)
    const updated = JSON.parse(r.stdout)
    expect(updated.name).toBe('Mia Updated')
    expect(updated.description).toBe('Lead')
  })
})

describe('actor-pack delete', () => {
  it('deletes a pack', () => {
    const created = JSON.parse(run('create', '--base-dir', tmpDir, '--name', 'Mia').stdout)
    const r = run('delete', '--base-dir', tmpDir, '--id', created.id)
    expect(r.status).toBe(0)
    expect(JSON.parse(r.stdout).deleted).toBe(true)
    const readResult = run('read', '--base-dir', tmpDir, '--id', created.id)
    expect(readResult.status).toBe(1)
  })
})

describe('actor-pack list', () => {
  it('lists all packs', () => {
    run('create', '--base-dir', tmpDir, '--name', 'Mia')
    run('create', '--base-dir', tmpDir, '--name', 'Leo')
    const r = run('list', '--base-dir', tmpDir)
    expect(r.status).toBe(0)
    const packs = JSON.parse(r.stdout)
    expect(packs).toHaveLength(2)
  })
  it('filters by keyword', () => {
    run('create', '--base-dir', tmpDir, '--name', 'Mia')
    run('create', '--base-dir', tmpDir, '--name', 'Leo')
    const r = run('list', '--base-dir', tmpDir, '--filter', 'mia')
    const packs = JSON.parse(r.stdout)
    expect(packs).toHaveLength(1)
    expect(packs[0].name).toBe('Mia')
  })
  it('returns empty array on empty base-dir', () => {
    const r = run('list', '--base-dir', tmpDir)
    expect(JSON.parse(r.stdout)).toEqual([])
  })
})

describe('actor-pack unknown subcommand', () => {
  it('exits 1', () => {
    const r = run('oops', '--base-dir', tmpDir)
    expect(r.status).toBe(1)
  })
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm exec vitest run skills/generating-actor-pack/scripts/actor-pack.__test__.js
```

Expected: FAIL — script does not exist.

- [ ] **Write the implementation**

```javascript
// skills/generating-actor-pack/scripts/actor-pack.js
import { join, resolve } from 'node:path'
import { rmSync } from 'node:fs'
import { parseArgs } from 'node:util'
import {
  SCHEMA_VERSION, generateId, readPack, writePack,
  errorExit, successOutput, listPacksInDir,
} from '../../lib/pack-utils.js'

function packPath(baseDir, id) {
  return join(resolve(baseDir), 'global', 'actors', id, 'pack.json')
}

function packDir(baseDir, id) {
  return join(resolve(baseDir), 'global', 'actors', id)
}

function create(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.name) errorExit('Missing required flag: --name')
  const id = generateId('actor')
  const now = new Date().toISOString()
  const pack = {
    $schemaVersion: SCHEMA_VERSION, id,
    name: v.name,
    description: v.description ?? '',
    appearance: v.appearance ?? '',
    tags: v.tags ? JSON.parse(v.tags) : [],
    viewCount: 1, promptTemplateId: null, images: [],
    createdAt: now, updatedAt: now,
  }
  writePack(packPath(v['base-dir'], id), pack)
  successOutput(pack)
}

function read(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { successOutput(readPack(packPath(v['base-dir'], v.id))) }
  catch (e) { errorExit(e.message) }
}

function update(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  let pack
  try { pack = readPack(packPath(v['base-dir'], v.id)) }
  catch (e) { errorExit(e.message) }
  if (v.name !== undefined) pack.name = v.name
  if (v.description !== undefined) pack.description = v.description
  if (v.appearance !== undefined) pack.appearance = v.appearance
  if (v.tags !== undefined) pack.tags = JSON.parse(v.tags)
  pack.updatedAt = new Date().toISOString()
  writePack(packPath(v['base-dir'], v.id), pack)
  successOutput(pack)
}

function deletePack(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try {
    rmSync(packDir(v['base-dir'], v.id), { recursive: true, force: true })
    successOutput({ id: v.id, deleted: true })
  } catch (e) { errorExit(e.message) }
}

function list(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  let packs = listPacksInDir(join(resolve(v['base-dir']), 'global', 'actors'))
  if (v.filter) {
    const kw = v.filter.toLowerCase()
    packs = packs.filter(p =>
      p.name.toLowerCase().includes(kw) || (p.description ?? '').toLowerCase().includes(kw)
    )
  }
  successOutput(packs)
}

function main() {
  const { values: v, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'base-dir': { type: 'string' }, name: { type: 'string' },
      description: { type: 'string' }, appearance: { type: 'string' },
      tags: { type: 'string' }, id: { type: 'string' }, filter: { type: 'string' },
    },
    allowPositionals: true, strict: false,
  })
  const cmds = { create, read, update, delete: deletePack, list }
  const [sub] = positionals
  if (!sub || !cmds[sub]) errorExit(`Unknown subcommand: ${sub ?? '(none)'}. Use: create|read|update|delete|list`)
  cmds[sub](v)
}

main()
```

- [ ] **Run test to verify it passes**

```bash
pnpm exec vitest run skills/generating-actor-pack/scripts/actor-pack.__test__.js
```

Expected: all tests PASS.

- [ ] **Commit**

```bash
git add skills/generating-actor-pack/
git commit -m "feat: add generating-actor-pack skill"
```

---

## Task 4: generating-scene-pack

**Files:**
- Create: `skills/generating-scene-pack/SKILL.md`
- Create: `skills/generating-scene-pack/scripts/scene-pack.js`
- Create: `skills/generating-scene-pack/scripts/scene-pack.__test__.js`

- [ ] **Write SKILL.md**

```markdown
---
name: generating-scene-pack
description: Use when creating, reading, updating, deleting, or listing global scene/environment references. Scenes are reusable across projects.
---

# Generating Scene Pack

Manages global location/environment references. A scene pack captures the visual identity of a setting (description, reference images) for reuse across shots and projects.

## Subcommands

```bash
pnpm exec dotenv -- node skills/generating-scene-pack/scripts/scene-pack.js <subcommand> [options]
```

### create
```bash
pnpm exec dotenv -- node skills/generating-scene-pack/scripts/scene-pack.js create \
  --base-dir assets/ --name "Rooftop at Sunset" \
  --description "Urban rooftop, haze, golden hour light, graffiti walls" \
  --tags '["exterior","urban","dusk"]'
```
Returns created pack JSON. File: `<base-dir>/global/scenes/<id>/pack.json`.

### read / update / delete / list
Same flags as actor-pack, replacing `actor` with `scene`. No `--appearance` flag.

## Schema

See `docs/design-docs/2026-03-27-production-pipeline-design.md` for the full scene pack schema.
```

- [ ] **Write the failing test**

```javascript
// skills/generating-scene-pack/scripts/scene-pack.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/generating-scene-pack/scripts/scene-pack.js'
function run(...args) { return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' }) }

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'scene-pack-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

describe('scene-pack create', () => {
  it('creates a pack', () => {
    const r = run('create', '--base-dir', tmpDir, '--name', 'Rooftop')
    expect(r.status).toBe(0)
    const pack = JSON.parse(r.stdout)
    expect(pack.id).toMatch(/^scene_/)
    expect(pack.name).toBe('Rooftop')
    expect(pack.$schemaVersion).toBe('1.0')
  })
  it('exits 1 when --name missing', () => {
    expect(run('create', '--base-dir', tmpDir).status).toBe(1)
  })
  it('exits 1 when --base-dir missing', () => {
    expect(run('create', '--name', 'X').status).toBe(1)
  })
})

describe('scene-pack read', () => {
  it('reads a created pack', () => {
    const id = JSON.parse(run('create', '--base-dir', tmpDir, '--name', 'Rooftop').stdout).id
    const r = run('read', '--base-dir', tmpDir, '--id', id)
    expect(r.status).toBe(0)
    expect(JSON.parse(r.stdout).name).toBe('Rooftop')
  })
  it('exits 1 for missing id', () => {
    expect(run('read', '--base-dir', tmpDir, '--id', 'scene_notexist').status).toBe(1)
  })
})

describe('scene-pack update', () => {
  it('updates name', () => {
    const id = JSON.parse(run('create', '--base-dir', tmpDir, '--name', 'Old').stdout).id
    const r = run('update', '--base-dir', tmpDir, '--id', id, '--name', 'New')
    expect(r.status).toBe(0)
    expect(JSON.parse(r.stdout).name).toBe('New')
  })
})

describe('scene-pack delete', () => {
  it('deletes a pack', () => {
    const id = JSON.parse(run('create', '--base-dir', tmpDir, '--name', 'X').stdout).id
    expect(run('delete', '--base-dir', tmpDir, '--id', id).status).toBe(0)
    expect(run('read', '--base-dir', tmpDir, '--id', id).status).toBe(1)
  })
})

describe('scene-pack list', () => {
  it('lists all packs', () => {
    run('create', '--base-dir', tmpDir, '--name', 'A')
    run('create', '--base-dir', tmpDir, '--name', 'B')
    const r = run('list', '--base-dir', tmpDir)
    expect(JSON.parse(r.stdout)).toHaveLength(2)
  })
  it('filters by keyword', () => {
    run('create', '--base-dir', tmpDir, '--name', 'Rooftop')
    run('create', '--base-dir', tmpDir, '--name', 'Alley')
    const r = run('list', '--base-dir', tmpDir, '--filter', 'roof')
    expect(JSON.parse(r.stdout)).toHaveLength(1)
  })
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm exec vitest run skills/generating-scene-pack/scripts/scene-pack.__test__.js
```

Expected: FAIL.

- [ ] **Write the implementation**

```javascript
// skills/generating-scene-pack/scripts/scene-pack.js
import { join, resolve } from 'node:path'
import { rmSync } from 'node:fs'
import { parseArgs } from 'node:util'
import {
  SCHEMA_VERSION, generateId, readPack, writePack,
  errorExit, successOutput, listPacksInDir,
} from '../../lib/pack-utils.js'

const ENTITY = 'scenes'
const PREFIX = 'scene'

function packPath(baseDir, id) { return join(resolve(baseDir), 'global', ENTITY, id, 'pack.json') }
function packDir(baseDir, id) { return join(resolve(baseDir), 'global', ENTITY, id) }

function create(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.name) errorExit('Missing required flag: --name')
  const id = generateId(PREFIX)
  const now = new Date().toISOString()
  const pack = {
    $schemaVersion: SCHEMA_VERSION, id, name: v.name,
    description: v.description ?? '', tags: v.tags ? JSON.parse(v.tags) : [],
    viewCount: 1, promptTemplateId: null, images: [],
    createdAt: now, updatedAt: now,
  }
  writePack(packPath(v['base-dir'], id), pack)
  successOutput(pack)
}

function read(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { successOutput(readPack(packPath(v['base-dir'], v.id))) }
  catch (e) { errorExit(e.message) }
}

function update(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  let pack
  try { pack = readPack(packPath(v['base-dir'], v.id)) }
  catch (e) { errorExit(e.message) }
  if (v.name !== undefined) pack.name = v.name
  if (v.description !== undefined) pack.description = v.description
  if (v.tags !== undefined) pack.tags = JSON.parse(v.tags)
  pack.updatedAt = new Date().toISOString()
  writePack(packPath(v['base-dir'], v.id), pack)
  successOutput(pack)
}

function deletePack(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { rmSync(packDir(v['base-dir'], v.id), { recursive: true, force: true }); successOutput({ id: v.id, deleted: true }) }
  catch (e) { errorExit(e.message) }
}

function list(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  let packs = listPacksInDir(join(resolve(v['base-dir']), 'global', ENTITY))
  if (v.filter) {
    const kw = v.filter.toLowerCase()
    packs = packs.filter(p => p.name.toLowerCase().includes(kw) || (p.description ?? '').toLowerCase().includes(kw))
  }
  successOutput(packs)
}

function main() {
  const { values: v, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'base-dir': { type: 'string' }, name: { type: 'string' },
      description: { type: 'string' }, tags: { type: 'string' },
      id: { type: 'string' }, filter: { type: 'string' },
    },
    allowPositionals: true, strict: false,
  })
  const cmds = { create, read, update, delete: deletePack, list }
  const [sub] = positionals
  if (!sub || !cmds[sub]) errorExit(`Unknown subcommand: ${sub ?? '(none)'}. Use: create|read|update|delete|list`)
  cmds[sub](v)
}

main()
```

- [ ] **Run test to verify it passes**

```bash
pnpm exec vitest run skills/generating-scene-pack/scripts/scene-pack.__test__.js
```

Expected: all PASS.

- [ ] **Commit**

```bash
git add skills/generating-scene-pack/
git commit -m "feat: add generating-scene-pack skill"
```

---

## Task 5: generating-prop-pack

**Files:**
- Create: `skills/generating-prop-pack/SKILL.md`
- Create: `skills/generating-prop-pack/scripts/prop-pack.js`
- Create: `skills/generating-prop-pack/scripts/prop-pack.__test__.js`

- [ ] **Write SKILL.md**

```markdown
---
name: generating-prop-pack
description: Use when creating, reading, updating, deleting, or listing global prop references. Props are physical objects reusable across projects.
---

# Generating Prop Pack

Manages global physical object references. A prop pack captures the appearance and identity of a physical object for consistent use across shots.

## Subcommands

```bash
pnpm exec dotenv -- node skills/generating-prop-pack/scripts/prop-pack.js <subcommand> [options]
```

### create
```bash
pnpm exec dotenv -- node skills/generating-prop-pack/scripts/prop-pack.js create \
  --base-dir assets/ --name "Vintage Guitar" \
  --description "Worn sunburst Telecaster, scratched body" \
  --tags '["instrument","music"]'
```
File: `<base-dir>/global/props/<id>/pack.json`.

### read / update / delete / list
Same flags as scene-pack (no `--appearance`).
```

- [ ] **Write the failing test**

```javascript
// skills/generating-prop-pack/scripts/prop-pack.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/generating-prop-pack/scripts/prop-pack.js'
function run(...args) { return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' }) }

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'prop-pack-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

it('creates a prop pack with correct id prefix', () => {
  const r = run('create', '--base-dir', tmpDir, '--name', 'Guitar')
  expect(r.status).toBe(0)
  expect(JSON.parse(r.stdout).id).toMatch(/^prop_/)
})
it('read/update/delete round-trip', () => {
  const id = JSON.parse(run('create', '--base-dir', tmpDir, '--name', 'Guitar').stdout).id
  expect(run('read', '--base-dir', tmpDir, '--id', id).status).toBe(0)
  expect(JSON.parse(run('update', '--base-dir', tmpDir, '--id', id, '--name', 'Bass').stdout).name).toBe('Bass')
  expect(run('delete', '--base-dir', tmpDir, '--id', id).status).toBe(0)
  expect(run('read', '--base-dir', tmpDir, '--id', id).status).toBe(1)
})
it('list returns all packs', () => {
  run('create', '--base-dir', tmpDir, '--name', 'A')
  run('create', '--base-dir', tmpDir, '--name', 'B')
  expect(JSON.parse(run('list', '--base-dir', tmpDir).stdout)).toHaveLength(2)
})
it('exits 1 on missing --name', () => {
  expect(run('create', '--base-dir', tmpDir).status).toBe(1)
})
it('exits 1 on missing --base-dir', () => {
  expect(run('create', '--name', 'X').status).toBe(1)
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm exec vitest run skills/generating-prop-pack/scripts/prop-pack.__test__.js
```

Expected: FAIL.

- [ ] **Write the implementation**

```javascript
// skills/generating-prop-pack/scripts/prop-pack.js
import { join, resolve } from 'node:path'
import { rmSync } from 'node:fs'
import { parseArgs } from 'node:util'
import {
  SCHEMA_VERSION, generateId, readPack, writePack,
  errorExit, successOutput, listPacksInDir,
} from '../../lib/pack-utils.js'

const ENTITY = 'props'
const PREFIX = 'prop'

function packPath(baseDir, id) { return join(resolve(baseDir), 'global', ENTITY, id, 'pack.json') }
function packDir(baseDir, id) { return join(resolve(baseDir), 'global', ENTITY, id) }

function create(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.name) errorExit('Missing required flag: --name')
  const id = generateId(PREFIX)
  const now = new Date().toISOString()
  const pack = {
    $schemaVersion: SCHEMA_VERSION, id, name: v.name,
    description: v.description ?? '', tags: v.tags ? JSON.parse(v.tags) : [],
    viewCount: 1, promptTemplateId: null, images: [],
    createdAt: now, updatedAt: now,
  }
  writePack(packPath(v['base-dir'], id), pack)
  successOutput(pack)
}

function read(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { successOutput(readPack(packPath(v['base-dir'], v.id))) }
  catch (e) { errorExit(e.message) }
}

function update(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  let pack
  try { pack = readPack(packPath(v['base-dir'], v.id)) }
  catch (e) { errorExit(e.message) }
  if (v.name !== undefined) pack.name = v.name
  if (v.description !== undefined) pack.description = v.description
  if (v.tags !== undefined) pack.tags = JSON.parse(v.tags)
  pack.updatedAt = new Date().toISOString()
  writePack(packPath(v['base-dir'], v.id), pack)
  successOutput(pack)
}

function deletePack(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { rmSync(packDir(v['base-dir'], v.id), { recursive: true, force: true }); successOutput({ id: v.id, deleted: true }) }
  catch (e) { errorExit(e.message) }
}

function list(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  let packs = listPacksInDir(join(resolve(v['base-dir']), 'global', ENTITY))
  if (v.filter) {
    const kw = v.filter.toLowerCase()
    packs = packs.filter(p => p.name.toLowerCase().includes(kw) || (p.description ?? '').toLowerCase().includes(kw))
  }
  successOutput(packs)
}

function main() {
  const { values: v, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'base-dir': { type: 'string' }, name: { type: 'string' },
      description: { type: 'string' }, tags: { type: 'string' },
      id: { type: 'string' }, filter: { type: 'string' },
    },
    allowPositionals: true, strict: false,
  })
  const cmds = { create, read, update, delete: deletePack, list }
  const [sub] = positionals
  if (!sub || !cmds[sub]) errorExit(`Unknown subcommand: ${sub ?? '(none)'}. Use: create|read|update|delete|list`)
  cmds[sub](v)
}

main()
```

- [ ] **Run test to verify it passes**

```bash
pnpm exec vitest run skills/generating-prop-pack/scripts/prop-pack.__test__.js
```

- [ ] **Commit**

```bash
git add skills/generating-prop-pack/
git commit -m "feat: add generating-prop-pack skill"
```

---

## Task 6: generating-costume-pack

**Files:**
- Create: `skills/generating-costume-pack/SKILL.md`
- Create: `skills/generating-costume-pack/scripts/costume-pack.js`
- Create: `skills/generating-costume-pack/scripts/costume-pack.__test__.js`

- [ ] **Write SKILL.md**

```markdown
---
name: generating-costume-pack
description: Use when creating, reading, updating, deleting, or listing global costume references. Costumes are clothing/appearance sets reusable across projects.
---

# Generating Costume Pack

Manages global costume references. A costume pack captures a clothing/appearance set for use in character compositions.

## Subcommands

```bash
pnpm exec dotenv -- node skills/generating-costume-pack/scripts/costume-pack.js <subcommand> [options]
```

### create
```bash
pnpm exec dotenv -- node skills/generating-costume-pack/scripts/costume-pack.js create \
  --base-dir assets/ --name "Stage Outfit — Black Leather" \
  --description "Black leather jacket, torn jeans, worn boots" \
  --tags '["stage","rock"]'
```
File: `<base-dir>/global/costumes/<id>/pack.json`.

### read / update / delete / list
Same flags as scene-pack (no `--appearance`).
```

- [ ] **Write the failing test**

```javascript
// skills/generating-costume-pack/scripts/costume-pack.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/generating-costume-pack/scripts/costume-pack.js'
function run(...args) { return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' }) }

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'costume-pack-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

it('creates a costume pack with correct id prefix', () => {
  const r = run('create', '--base-dir', tmpDir, '--name', 'Leather Jacket')
  expect(r.status).toBe(0)
  expect(JSON.parse(r.stdout).id).toMatch(/^costume_/)
})
it('read/update/delete round-trip', () => {
  const id = JSON.parse(run('create', '--base-dir', tmpDir, '--name', 'Jacket').stdout).id
  expect(run('read', '--base-dir', tmpDir, '--id', id).status).toBe(0)
  expect(JSON.parse(run('update', '--base-dir', tmpDir, '--id', id, '--name', 'Vest').stdout).name).toBe('Vest')
  expect(run('delete', '--base-dir', tmpDir, '--id', id).status).toBe(0)
  expect(run('read', '--base-dir', tmpDir, '--id', id).status).toBe(1)
})
it('list returns all packs', () => {
  run('create', '--base-dir', tmpDir, '--name', 'A')
  run('create', '--base-dir', tmpDir, '--name', 'B')
  expect(JSON.parse(run('list', '--base-dir', tmpDir).stdout)).toHaveLength(2)
})
it('exits 1 on missing --name', () => {
  expect(run('create', '--base-dir', tmpDir).status).toBe(1)
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm exec vitest run skills/generating-costume-pack/scripts/costume-pack.__test__.js
```

- [ ] **Write the implementation**

```javascript
// skills/generating-costume-pack/scripts/costume-pack.js
import { join, resolve } from 'node:path'
import { rmSync } from 'node:fs'
import { parseArgs } from 'node:util'
import {
  SCHEMA_VERSION, generateId, readPack, writePack,
  errorExit, successOutput, listPacksInDir,
} from '../../lib/pack-utils.js'

const ENTITY = 'costumes'
const PREFIX = 'costume'

function packPath(baseDir, id) { return join(resolve(baseDir), 'global', ENTITY, id, 'pack.json') }
function packDir(baseDir, id) { return join(resolve(baseDir), 'global', ENTITY, id) }

function create(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.name) errorExit('Missing required flag: --name')
  const id = generateId(PREFIX)
  const now = new Date().toISOString()
  const pack = {
    $schemaVersion: SCHEMA_VERSION, id, name: v.name,
    description: v.description ?? '', tags: v.tags ? JSON.parse(v.tags) : [],
    viewCount: 1, promptTemplateId: null, images: [],
    createdAt: now, updatedAt: now,
  }
  writePack(packPath(v['base-dir'], id), pack)
  successOutput(pack)
}

function read(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { successOutput(readPack(packPath(v['base-dir'], v.id))) }
  catch (e) { errorExit(e.message) }
}

function update(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  let pack
  try { pack = readPack(packPath(v['base-dir'], v.id)) }
  catch (e) { errorExit(e.message) }
  if (v.name !== undefined) pack.name = v.name
  if (v.description !== undefined) pack.description = v.description
  if (v.tags !== undefined) pack.tags = JSON.parse(v.tags)
  pack.updatedAt = new Date().toISOString()
  writePack(packPath(v['base-dir'], v.id), pack)
  successOutput(pack)
}

function deletePack(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { rmSync(packDir(v['base-dir'], v.id), { recursive: true, force: true }); successOutput({ id: v.id, deleted: true }) }
  catch (e) { errorExit(e.message) }
}

function list(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  let packs = listPacksInDir(join(resolve(v['base-dir']), 'global', ENTITY))
  if (v.filter) {
    const kw = v.filter.toLowerCase()
    packs = packs.filter(p => p.name.toLowerCase().includes(kw) || (p.description ?? '').toLowerCase().includes(kw))
  }
  successOutput(packs)
}

function main() {
  const { values: v, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'base-dir': { type: 'string' }, name: { type: 'string' },
      description: { type: 'string' }, tags: { type: 'string' },
      id: { type: 'string' }, filter: { type: 'string' },
    },
    allowPositionals: true, strict: false,
  })
  const cmds = { create, read, update, delete: deletePack, list }
  const [sub] = positionals
  if (!sub || !cmds[sub]) errorExit(`Unknown subcommand: ${sub ?? '(none)'}. Use: create|read|update|delete|list`)
  cmds[sub](v)
}

main()
```

- [ ] **Run test to verify it passes**

```bash
pnpm exec vitest run skills/generating-costume-pack/scripts/costume-pack.__test__.js
```

- [ ] **Commit**

```bash
git add skills/generating-costume-pack/
git commit -m "feat: add generating-costume-pack skill"
```

---

## Task 7: generating-character-pack

**Files:**
- Create: `skills/generating-character-pack/SKILL.md`
- Create: `skills/generating-character-pack/scripts/character-pack.js`
- Create: `skills/generating-character-pack/scripts/character-pack.__test__.js`

Character packs differ from the other packs: path is `<base-dir>/characters/<id>/pack.json` (not `global/`), `--actor-id` is required on create, `--costume-id` and `--prop-ids` are optional, and create validates that the referenced actor pack exists.

- [ ] **Write SKILL.md**

```markdown
---
name: generating-character-pack
description: Use when creating, reading, updating, deleting, or listing project-scoped character compositions (actor + costume + props).
---

# Generating Character Pack

Manages project-scoped character compositions. A character pack links one actor (appearance) with an optional costume and zero or more props into a named role for a specific production.

## Subcommands

```bash
pnpm exec dotenv -- node skills/generating-character-pack/scripts/character-pack.js <subcommand> [options]
```

### create
```bash
pnpm exec dotenv -- node skills/generating-character-pack/scripts/character-pack.js create \
  --base-dir assets/ --name "Mia — Stage Role" \
  --actor-id actor_lz4x7 \
  --costume-id costume_lz4xa \
  --prop-ids '["prop_lz4xb"]' \
  --description "Project-specific role"
```
Validates that `actor-id` references an existing actor pack. File: `<base-dir>/characters/<id>/pack.json`.

### read / update / delete / list
Same `--base-dir`, `--id`, `--filter` flags. Update accepts `--actor-id`, `--costume-id`, `--prop-ids`.
```

- [ ] **Write the failing test**

```javascript
// skills/generating-character-pack/scripts/character-pack.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const CHAR_SCRIPT = 'skills/generating-character-pack/scripts/character-pack.js'
const ACTOR_SCRIPT = 'skills/generating-actor-pack/scripts/actor-pack.js'

function run(script, ...args) { return spawnSync('node', [script, ...args], { encoding: 'utf8' }) }

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'char-pack-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

function createActor(name = 'Mia') {
  return JSON.parse(run(ACTOR_SCRIPT, 'create', '--base-dir', tmpDir, '--name', name).stdout)
}

describe('character-pack create', () => {
  it('creates a character pack with required actor-id', () => {
    const actor = createActor()
    const r = run(CHAR_SCRIPT, 'create', '--base-dir', tmpDir, '--name', 'Mia Stage', '--actor-id', actor.id)
    expect(r.status).toBe(0)
    const pack = JSON.parse(r.stdout)
    expect(pack.id).toMatch(/^char_/)
    expect(pack.actorId).toBe(actor.id)
    expect(pack.$schemaVersion).toBe('1.0')
  })
  it('exits 1 when actor-id does not exist', () => {
    const r = run(CHAR_SCRIPT, 'create', '--base-dir', tmpDir, '--name', 'X', '--actor-id', 'actor_notexist')
    expect(r.status).toBe(1)
    expect(JSON.parse(r.stderr).error).toContain('actor')
  })
  it('exits 1 when --actor-id is missing', () => {
    const r = run(CHAR_SCRIPT, 'create', '--base-dir', tmpDir, '--name', 'X')
    expect(r.status).toBe(1)
  })
  it('accepts optional costume-id and prop-ids', () => {
    const actor = createActor()
    const r = run(CHAR_SCRIPT, 'create', '--base-dir', tmpDir, '--name', 'Full', '--actor-id', actor.id, '--prop-ids', '[]')
    expect(r.status).toBe(0)
    expect(JSON.parse(r.stdout).propIds).toEqual([])
  })
})

describe('character-pack read/update/delete/list', () => {
  it('round-trips correctly', () => {
    const actor = createActor()
    const id = JSON.parse(run(CHAR_SCRIPT, 'create', '--base-dir', tmpDir, '--name', 'Role', '--actor-id', actor.id).stdout).id
    expect(run(CHAR_SCRIPT, 'read', '--base-dir', tmpDir, '--id', id).status).toBe(0)
    const updated = JSON.parse(run(CHAR_SCRIPT, 'update', '--base-dir', tmpDir, '--id', id, '--name', 'New Role').stdout)
    expect(updated.name).toBe('New Role')
    expect(run(CHAR_SCRIPT, 'delete', '--base-dir', tmpDir, '--id', id).status).toBe(0)
    expect(run(CHAR_SCRIPT, 'read', '--base-dir', tmpDir, '--id', id).status).toBe(1)
  })
  it('list returns all characters', () => {
    const actor = createActor()
    run(CHAR_SCRIPT, 'create', '--base-dir', tmpDir, '--name', 'A', '--actor-id', actor.id)
    run(CHAR_SCRIPT, 'create', '--base-dir', tmpDir, '--name', 'B', '--actor-id', actor.id)
    expect(JSON.parse(run(CHAR_SCRIPT, 'list', '--base-dir', tmpDir).stdout)).toHaveLength(2)
  })
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm exec vitest run skills/generating-character-pack/scripts/character-pack.__test__.js
```

Expected: FAIL.

- [ ] **Write the implementation**

```javascript
// skills/generating-character-pack/scripts/character-pack.js
import { join, resolve } from 'node:path'
import { rmSync, existsSync } from 'node:fs'
import { parseArgs } from 'node:util'
import {
  SCHEMA_VERSION, generateId, readPack, writePack,
  errorExit, successOutput, listPacksInDir,
} from '../../lib/pack-utils.js'

function packPath(baseDir, id) { return join(resolve(baseDir), 'characters', id, 'pack.json') }
function packDir(baseDir, id) { return join(resolve(baseDir), 'characters', id) }
function actorPackPath(baseDir, actorId) { return join(resolve(baseDir), 'global', 'actors', actorId, 'pack.json') }

function create(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.name) errorExit('Missing required flag: --name')
  if (!v['actor-id']) errorExit('Missing required flag: --actor-id')
  if (!existsSync(actorPackPath(v['base-dir'], v['actor-id']))) {
    errorExit(`Actor pack not found: ${v['actor-id']}. Create it first with generating-actor-pack.`)
  }
  const id = generateId('char')
  const now = new Date().toISOString()
  const pack = {
    $schemaVersion: SCHEMA_VERSION, id, name: v.name,
    description: v.description ?? '',
    actorId: v['actor-id'],
    costumeId: v['costume-id'] ?? null,
    propIds: v['prop-ids'] ? JSON.parse(v['prop-ids']) : [],
    images: [], createdAt: now, updatedAt: now,
  }
  writePack(packPath(v['base-dir'], id), pack)
  successOutput(pack)
}

function read(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { successOutput(readPack(packPath(v['base-dir'], v.id))) }
  catch (e) { errorExit(e.message) }
}

function update(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  let pack
  try { pack = readPack(packPath(v['base-dir'], v.id)) }
  catch (e) { errorExit(e.message) }
  if (v.name !== undefined) pack.name = v.name
  if (v.description !== undefined) pack.description = v.description
  if (v['actor-id'] !== undefined) pack.actorId = v['actor-id']
  if (v['costume-id'] !== undefined) pack.costumeId = v['costume-id']
  if (v['prop-ids'] !== undefined) pack.propIds = JSON.parse(v['prop-ids'])
  pack.updatedAt = new Date().toISOString()
  writePack(packPath(v['base-dir'], v.id), pack)
  successOutput(pack)
}

function deletePack(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { rmSync(packDir(v['base-dir'], v.id), { recursive: true, force: true }); successOutput({ id: v.id, deleted: true }) }
  catch (e) { errorExit(e.message) }
}

function list(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  let packs = listPacksInDir(join(resolve(v['base-dir']), 'characters'))
  if (v.filter) {
    const kw = v.filter.toLowerCase()
    packs = packs.filter(p => p.name.toLowerCase().includes(kw) || (p.description ?? '').toLowerCase().includes(kw))
  }
  successOutput(packs)
}

function main() {
  const { values: v, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'base-dir': { type: 'string' }, name: { type: 'string' },
      description: { type: 'string' }, 'actor-id': { type: 'string' },
      'costume-id': { type: 'string' }, 'prop-ids': { type: 'string' },
      id: { type: 'string' }, filter: { type: 'string' },
    },
    allowPositionals: true, strict: false,
  })
  const cmds = { create, read, update, delete: deletePack, list }
  const [sub] = positionals
  if (!sub || !cmds[sub]) errorExit(`Unknown subcommand: ${sub ?? '(none)'}. Use: create|read|update|delete|list`)
  cmds[sub](v)
}

main()
```

- [ ] **Run test to verify it passes**

```bash
pnpm exec vitest run skills/generating-character-pack/scripts/character-pack.__test__.js
```

- [ ] **Commit**

```bash
git add skills/generating-character-pack/
git commit -m "feat: add generating-character-pack skill"
```

---

## Task 8: prompt-template

**Files:**
- Create: `skills/prompt-template/SKILL.md`
- Create: `skills/prompt-template/scripts/prompt-template.js`
- Create: `skills/prompt-template/scripts/prompt-template.__test__.js`

Prompt templates differ: stored at `<base-dir>/global/templates/<id>/template.json`, schema has `category`, `content`, `variables`, `isDefault`, `isSystem` fields (no `images`, `viewCount`, `appearance`).

- [ ] **Write SKILL.md**

```markdown
---
name: prompt-template
description: Use when creating, reading, updating, deleting, or listing reusable prompt templates with {{variable}} slots for video generation.
---

# Prompt Template

Manages reusable prompt templates with `{{variable}}` slots. Agents substitute values when applying a template to a shot.

## Subcommands

```bash
pnpm exec dotenv -- node skills/prompt-template/scripts/prompt-template.js <subcommand> [options]
```

### create
```bash
pnpm exec dotenv -- node skills/prompt-template/scripts/prompt-template.js create \
  --base-dir assets/ \
  --name "High-Energy Performance" \
  --category video_prompt \
  --content "{{character}} performing with intense energy, {{cameraMovement}}, {{lighting}}, cinematic 35mm" \
  --variables '["character","cameraMovement","lighting"]' \
  --preview "Performance shot with dynamic lighting"
```
File: `<base-dir>/global/templates/<id>/template.json`.

### read / update / delete / list
`--id`, `--base-dir`, `--filter` work the same. Update accepts any create flag except `--category`.

## Category values
`video_prompt | storyboard_prompt | bgm | sfx | character_image_front | character_image_other | actor_image_front | actor_image_other | prop_image_front | prop_image_other | scene_image_front | scene_image_other | costume_image_front | costume_image_other | frame_head_image | frame_tail_image | frame_key_image | frame_head_prompt | frame_tail_prompt | frame_key_prompt | combined`
```

- [ ] **Write the failing test**

```javascript
// skills/prompt-template/scripts/prompt-template.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/prompt-template/scripts/prompt-template.js'
function run(...args) { return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' }) }

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'prompt-tmpl-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

describe('prompt-template create', () => {
  it('creates a template with correct schema', () => {
    const r = run('create', '--base-dir', tmpDir,
      '--name', 'My Template',
      '--category', 'video_prompt',
      '--content', '{{character}} in {{scene}}',
      '--variables', '["character","scene"]')
    expect(r.status).toBe(0)
    const tmpl = JSON.parse(r.stdout)
    expect(tmpl.id).toMatch(/^tmpl_/)
    expect(tmpl.category).toBe('video_prompt')
    expect(tmpl.content).toBe('{{character}} in {{scene}}')
    expect(tmpl.variables).toEqual(['character', 'scene'])
    expect(tmpl.$schemaVersion).toBe('1.0')
    expect(tmpl.isDefault).toBe(false)
    expect(tmpl.isSystem).toBe(false)
  })
  it('exits 1 when --category missing', () => {
    const r = run('create', '--base-dir', tmpDir, '--name', 'X', '--content', 'y', '--variables', '[]')
    expect(r.status).toBe(1)
  })
  it('exits 1 when --content missing', () => {
    const r = run('create', '--base-dir', tmpDir, '--name', 'X', '--category', 'video_prompt', '--variables', '[]')
    expect(r.status).toBe(1)
  })
  it('exits 1 when --variables missing', () => {
    const r = run('create', '--base-dir', tmpDir, '--name', 'X', '--category', 'video_prompt', '--content', 'y')
    expect(r.status).toBe(1)
  })
})

describe('prompt-template read/update/delete/list', () => {
  it('round-trips', () => {
    const id = JSON.parse(run('create', '--base-dir', tmpDir, '--name', 'T', '--category', 'video_prompt', '--content', 'x', '--variables', '[]').stdout).id
    expect(run('read', '--base-dir', tmpDir, '--id', id).status).toBe(0)
    expect(JSON.parse(run('update', '--base-dir', tmpDir, '--id', id, '--name', 'T2').stdout).name).toBe('T2')
    expect(run('delete', '--base-dir', tmpDir, '--id', id).status).toBe(0)
    expect(run('read', '--base-dir', tmpDir, '--id', id).status).toBe(1)
  })
  it('list returns all templates', () => {
    run('create', '--base-dir', tmpDir, '--name', 'A', '--category', 'video_prompt', '--content', 'a', '--variables', '[]')
    run('create', '--base-dir', tmpDir, '--name', 'B', '--category', 'bgm', '--content', 'b', '--variables', '[]')
    expect(JSON.parse(run('list', '--base-dir', tmpDir).stdout)).toHaveLength(2)
  })
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm exec vitest run skills/prompt-template/scripts/prompt-template.__test__.js
```

- [ ] **Write the implementation**

```javascript
// skills/prompt-template/scripts/prompt-template.js
import { join, resolve } from 'node:path'
import { rmSync } from 'node:fs'
import { parseArgs } from 'node:util'
import {
  SCHEMA_VERSION, generateId, readPack, writePack,
  errorExit, successOutput, listPacksInDir,
} from '../../lib/pack-utils.js'

function tmplPath(baseDir, id) { return join(resolve(baseDir), 'global', 'templates', id, 'template.json') }
function tmplDir(baseDir, id) { return join(resolve(baseDir), 'global', 'templates', id) }

// listPacksInDir expects pack.json; templates use template.json — use a custom lister
import { existsSync, readdirSync, readFileSync } from 'node:fs'
function listTemplatesInDir(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(e => {
      const p = join(dir, e.name, 'template.json')
      if (!existsSync(p)) return []
      try { return [JSON.parse(readFileSync(p, 'utf8'))] } catch { return [] }
    })
}

function create(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.name) errorExit('Missing required flag: --name')
  if (!v.category) errorExit('Missing required flag: --category')
  if (!v.content) errorExit('Missing required flag: --content')
  if (!v.variables) errorExit('Missing required flag: --variables')
  const id = generateId('tmpl')
  const now = new Date().toISOString()
  const tmpl = {
    $schemaVersion: SCHEMA_VERSION, id,
    category: v.category, name: v.name,
    preview: v.preview ?? '',
    content: v.content,
    variables: JSON.parse(v.variables),
    isDefault: v['is-default'] === true || v['is-default'] === 'true',
    isSystem: false,
    createdAt: now, updatedAt: now,
  }
  writePack(tmplPath(v['base-dir'], id), tmpl)
  successOutput(tmpl)
}

function read(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { successOutput(readPack(tmplPath(v['base-dir'], v.id))) }
  catch (e) { errorExit(e.message) }
}

function update(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  let tmpl
  try { tmpl = readPack(tmplPath(v['base-dir'], v.id)) }
  catch (e) { errorExit(e.message) }
  if (v.name !== undefined) tmpl.name = v.name
  if (v.content !== undefined) tmpl.content = v.content
  if (v.variables !== undefined) tmpl.variables = JSON.parse(v.variables)
  if (v.preview !== undefined) tmpl.preview = v.preview
  if (v['is-default'] !== undefined) tmpl.isDefault = v['is-default'] === true || v['is-default'] === 'true'
  tmpl.updatedAt = new Date().toISOString()
  writePack(tmplPath(v['base-dir'], v.id), tmpl)
  successOutput(tmpl)
}

function deleteTmpl(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { rmSync(tmplDir(v['base-dir'], v.id), { recursive: true, force: true }); successOutput({ id: v.id, deleted: true }) }
  catch (e) { errorExit(e.message) }
}

function list(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  let tmpls = listTemplatesInDir(join(resolve(v['base-dir']), 'global', 'templates'))
  if (v.filter) {
    const kw = v.filter.toLowerCase()
    tmpls = tmpls.filter(t => t.name.toLowerCase().includes(kw) || (t.preview ?? '').toLowerCase().includes(kw))
  }
  successOutput(tmpls)
}

function main() {
  const { values: v, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'base-dir': { type: 'string' }, name: { type: 'string' },
      category: { type: 'string' }, content: { type: 'string' },
      variables: { type: 'string' }, preview: { type: 'string' },
      'is-default': { type: 'string' }, id: { type: 'string' }, filter: { type: 'string' },
    },
    allowPositionals: true, strict: false,
  })
  const cmds = { create, read, update, delete: deleteTmpl, list }
  const [sub] = positionals
  if (!sub || !cmds[sub]) errorExit(`Unknown subcommand: ${sub ?? '(none)'}. Use: create|read|update|delete|list`)
  cmds[sub](v)
}

main()
```

- [ ] **Run test to verify it passes**

```bash
pnpm exec vitest run skills/prompt-template/scripts/prompt-template.__test__.js
```

- [ ] **Commit**

```bash
git add skills/prompt-template/
git commit -m "feat: add prompt-template skill"
```

---

## Task 9: script-breakdown

**Files:**
- Create: `skills/script-breakdown/SKILL.md`
- Create: `skills/script-breakdown/scripts/validate-shot-list.js`
- Create: `skills/script-breakdown/scripts/validate-shot-list.__test__.js`

- [ ] **Write SKILL.md**

```markdown
---
name: script-breakdown
description: Use when converting any raw text (lyrics, screenplay, brief) into an indexed shot list and chapter summary for a video production.
---

# Script Breakdown

Converts any raw text input into a structured chapter and indexed shot list. The agent reads the input text, condenses it, divides it into shots, names each shot, and identifies characters and scenes per shot.

## Inputs

- Raw text (lyrics, screenplay, story brief) — provided by the user or read from `chapter.json#rawText`
- `--base-dir <path>` — project root
- `--chapter-dir <path>` — e.g. `<base-dir>/chapters/chap_abc`

## Dependencies

None. This is the first skill in the production pipeline.

## Workflow

1. Receive raw text input.
2. Condense the text: simplify language, remove stage directions not relevant to visuals, preserve meaning. Store as `condensedText`.
3. Divide condensed text into shots. Each shot covers one visual moment (4–8 seconds). Index from 1.
4. For each shot, identify: title, script excerpt, character names, scene names, status (`pending`).
5. Write `chapter.json`:
   ```bash
   # chapter.json is written manually by the agent — no script for this file
   ```
6. Write `shot-list.json` to `--chapter-dir`.
7. Validate:
   ```bash
   pnpm exec dotenv -- node skills/script-breakdown/scripts/validate-shot-list.js \
     --file <chapter-dir>/shot-list.json
   ```

## Output

- `<chapter-dir>/chapter.json` — chapter metadata with raw and condensed text
- `<chapter-dir>/shot-list.json` — indexed shot array

## Validation

```bash
pnpm exec dotenv -- node skills/script-breakdown/scripts/validate-shot-list.js --file <path>
```

Exits 0 on valid, 1 on invalid (error to stderr).

## Error Handling

- If condensed text loses meaning: show both versions to the user and ask to confirm before continuing.
- If a shot has no identifiable characters or scenes: leave arrays empty, do not invent them.
```

- [ ] **Write the failing test**

```javascript
// skills/script-breakdown/scripts/validate-shot-list.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/script-breakdown/scripts/validate-shot-list.js'
function validate(data) {
  const f = join(tmpDir, 'shot-list.json')
  writeFileSync(f, JSON.stringify(data), 'utf8')
  return spawnSync('node', [SCRIPT, '--file', f], { encoding: 'utf8' })
}

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'shot-list-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

const VALID = {
  $schemaVersion: '1.0',
  chapterId: 'chap_abc',
  generatedAt: '2026-03-27T00:00:00Z',
  shots: [{
    index: 1, title: 'Opening', scriptExcerpt: 'The lights go down.',
    characterNames: ['Mia'], sceneNames: ['Stage'], status: 'pending',
  }],
}

it('accepts a valid shot list', () => {
  expect(validate(VALID).status).toBe(0)
})
it('rejects missing $schemaVersion', () => {
  const d = { ...VALID }; delete d.$schemaVersion
  expect(validate(d).status).toBe(1)
})
it('rejects unknown $schemaVersion', () => {
  expect(validate({ ...VALID, $schemaVersion: '99.0' }).status).toBe(1)
})
it('rejects missing chapterId', () => {
  const d = { ...VALID }; delete d.chapterId
  expect(validate(d).status).toBe(1)
})
it('rejects non-array shots', () => {
  expect(validate({ ...VALID, shots: 'bad' }).status).toBe(1)
})
it('rejects shot with non-number index', () => {
  expect(validate({ ...VALID, shots: [{ ...VALID.shots[0], index: 'one' }] }).status).toBe(1)
})
it('rejects shot with invalid status', () => {
  expect(validate({ ...VALID, shots: [{ ...VALID.shots[0], status: 'unknown' }] }).status).toBe(1)
})
it('exits 1 when --file missing', () => {
  expect(spawnSync('node', [SCRIPT], { encoding: 'utf8' }).status).toBe(1)
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm exec vitest run skills/script-breakdown/scripts/validate-shot-list.__test__.js
```

- [ ] **Write the implementation**

```javascript
// skills/script-breakdown/scripts/validate-shot-list.js
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const SCHEMA_VERSION = '1.0'
const VALID_STATUSES = ['pending', 'generating', 'ready']

function validate(data) {
  if (data.$schemaVersion === undefined) throw new Error('Missing $schemaVersion')
  if (data.$schemaVersion !== SCHEMA_VERSION) throw new Error(`Unknown $schemaVersion: ${data.$schemaVersion}`)
  if (!data.chapterId || typeof data.chapterId !== 'string') throw new Error('Missing or invalid chapterId')
  if (!data.generatedAt || typeof data.generatedAt !== 'string') throw new Error('Missing generatedAt')
  if (!Array.isArray(data.shots)) throw new Error('shots must be an array')
  for (const [i, shot] of data.shots.entries()) {
    if (typeof shot.index !== 'number') throw new Error(`shots[${i}].index must be a number`)
    if (typeof shot.title !== 'string') throw new Error(`shots[${i}].title must be a string`)
    if (typeof shot.scriptExcerpt !== 'string') throw new Error(`shots[${i}].scriptExcerpt must be a string`)
    if (!Array.isArray(shot.characterNames)) throw new Error(`shots[${i}].characterNames must be an array`)
    if (!Array.isArray(shot.sceneNames)) throw new Error(`shots[${i}].sceneNames must be an array`)
    if (!VALID_STATUSES.includes(shot.status)) {
      throw new Error(`shots[${i}].status must be one of: ${VALID_STATUSES.join(', ')}`)
    }
  }
}

function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: { file: { type: 'string' } },
    strict: false,
  })
  if (!values.file) { process.stderr.write('Missing required flag: --file\n'); process.exit(1) }
  let data
  try { data = JSON.parse(readFileSync(values.file, 'utf8')) }
  catch (e) { process.stderr.write(`Failed to read file: ${e.message}\n`); process.exit(1) }
  try { validate(data); process.exit(0) }
  catch (e) { process.stderr.write(e.message + '\n'); process.exit(1) }
}

main()
```

- [ ] **Run test to verify it passes**

```bash
pnpm exec vitest run skills/script-breakdown/scripts/validate-shot-list.__test__.js
```

- [ ] **Commit**

```bash
git add skills/script-breakdown/
git commit -m "feat: add script-breakdown skill"
```

---

## Task 10: entity-extraction

**Files:**
- Create: `skills/entity-extraction/SKILL.md`
- Create: `skills/entity-extraction/scripts/validate-extraction-report.js`
- Create: `skills/entity-extraction/scripts/validate-extraction-report.__test__.js`

- [ ] **Write SKILL.md**

```markdown
---
name: entity-extraction
description: Use when populating actor, scene, prop, and costume packs from a shot list. Runs after script-breakdown, before shot-detail.
---

# Entity Extraction

Reads a `shot-list.json`, identifies all named entities (characters, scenes, props, costumes), creates or reuses pack files for each, and writes an `extraction-report.json` mapping entity IDs to shots.

## Inputs

- `<chapter-dir>/shot-list.json` — produced by `script-breakdown`
- `--base-dir <path>` — project root
- `--chapter-dir <path>` — e.g. `<base-dir>/chapters/chap_abc`

## Dependencies

- `script-breakdown` must have run first (produces `shot-list.json`)
- Pack management scripts must be available for creating new packs

## Workflow

1. Read `shot-list.json`.
2. For each shot, collect `characterNames` and `sceneNames`.
3. For each unique name:
   a. Run `list --filter <name>` on the relevant pack script to check for an existing pack (fuzzy name match).
   b. If found, reuse the existing ID.
   c. If not found, run `create` to create a new pack.
4. Build `shotEntityRefs`: for each shot, list the resolved actor/scene/prop/costume IDs.
   - Populate `actorIds` (not `characterIds` — character creation is a separate deliberate step).
5. Build `newEntities`: IDs of packs created in this run only.
6. Write `extraction-report.json` to `--chapter-dir`.
7. Validate:
   ```bash
   pnpm exec dotenv -- node skills/entity-extraction/scripts/validate-extraction-report.js \
     --file <chapter-dir>/extraction-report.json
   ```

## Output

- Pack files under `<base-dir>/global/` and `<base-dir>/characters/`
- `<chapter-dir>/extraction-report.json`

## Validation

```bash
pnpm exec dotenv -- node skills/entity-extraction/scripts/validate-extraction-report.js --file <path>
```

## Error Handling

- If a name is ambiguous (multiple pack matches): present options to user and ask which to use.
- Never auto-create character packs — that is a deliberate agent step done after reviewing extraction results.
- On re-run: overwrite `extraction-report.json` fully. Never delete existing packs.
```

- [ ] **Write the failing test**

```javascript
// skills/entity-extraction/scripts/validate-extraction-report.__test__.js
import { it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/entity-extraction/scripts/validate-extraction-report.js'
function validate(data) {
  const f = join(tmpDir, 'report.json')
  writeFileSync(f, JSON.stringify(data), 'utf8')
  return spawnSync('node', [SCRIPT, '--file', f], { encoding: 'utf8' })
}

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'extraction-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

const VALID = {
  $schemaVersion: '1.0',
  chapterId: 'chap_abc',
  generatedAt: '2026-03-27T00:00:00Z',
  shotEntityRefs: [{
    shotIndex: 1,
    actorIds: ['actor_abc'],
    characterIds: [],
    sceneIds: ['scene_xyz'],
    propIds: [],
    costumeIds: [],
  }],
  newEntities: { actors: ['actor_abc'], scenes: ['scene_xyz'], props: [], costumes: [] },
}

it('accepts valid extraction report', () => { expect(validate(VALID).status).toBe(0) })
it('rejects missing $schemaVersion', () => { const d = { ...VALID }; delete d.$schemaVersion; expect(validate(d).status).toBe(1) })
it('rejects unknown $schemaVersion', () => { expect(validate({ ...VALID, $schemaVersion: '2.0' }).status).toBe(1) })
it('rejects missing chapterId', () => { const d = { ...VALID }; delete d.chapterId; expect(validate(d).status).toBe(1) })
it('rejects non-array shotEntityRefs', () => { expect(validate({ ...VALID, shotEntityRefs: null }).status).toBe(1) })
it('rejects ref with non-number shotIndex', () => {
  expect(validate({ ...VALID, shotEntityRefs: [{ ...VALID.shotEntityRefs[0], shotIndex: 'one' }] }).status).toBe(1)
})
it('rejects ref with non-array actorIds', () => {
  expect(validate({ ...VALID, shotEntityRefs: [{ ...VALID.shotEntityRefs[0], actorIds: 'bad' }] }).status).toBe(1)
})
it('exits 1 when --file missing', () => {
  expect(spawnSync('node', [SCRIPT], { encoding: 'utf8' }).status).toBe(1)
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm exec vitest run skills/entity-extraction/scripts/validate-extraction-report.__test__.js
```

- [ ] **Write the implementation**

```javascript
// skills/entity-extraction/scripts/validate-extraction-report.js
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const SCHEMA_VERSION = '1.0'

function validate(data) {
  if (data.$schemaVersion === undefined) throw new Error('Missing $schemaVersion')
  if (data.$schemaVersion !== SCHEMA_VERSION) throw new Error(`Unknown $schemaVersion: ${data.$schemaVersion}`)
  if (!data.chapterId || typeof data.chapterId !== 'string') throw new Error('Missing or invalid chapterId')
  if (!data.generatedAt || typeof data.generatedAt !== 'string') throw new Error('Missing generatedAt')
  if (!Array.isArray(data.shotEntityRefs)) throw new Error('shotEntityRefs must be an array')
  for (const [i, ref] of data.shotEntityRefs.entries()) {
    if (typeof ref.shotIndex !== 'number') throw new Error(`shotEntityRefs[${i}].shotIndex must be a number`)
    for (const field of ['actorIds', 'characterIds', 'sceneIds', 'propIds', 'costumeIds']) {
      if (!Array.isArray(ref[field])) throw new Error(`shotEntityRefs[${i}].${field} must be an array`)
    }
  }
  if (!data.newEntities || typeof data.newEntities !== 'object') throw new Error('Missing newEntities')
  for (const field of ['actors', 'scenes', 'props', 'costumes']) {
    if (!Array.isArray(data.newEntities[field])) throw new Error(`newEntities.${field} must be an array`)
  }
}

function main() {
  const { values } = parseArgs({ args: process.argv.slice(2), options: { file: { type: 'string' } }, strict: false })
  if (!values.file) { process.stderr.write('Missing required flag: --file\n'); process.exit(1) }
  let data
  try { data = JSON.parse(readFileSync(values.file, 'utf8')) }
  catch (e) { process.stderr.write(`Failed to read file: ${e.message}\n`); process.exit(1) }
  try { validate(data); process.exit(0) }
  catch (e) { process.stderr.write(e.message + '\n'); process.exit(1) }
}

main()
```

- [ ] **Run test to verify it passes**

```bash
pnpm exec vitest run skills/entity-extraction/scripts/validate-extraction-report.__test__.js
```

- [ ] **Commit**

```bash
git add skills/entity-extraction/
git commit -m "feat: add entity-extraction skill"
```

---

## Task 11: shot-detail

**Files:**
- Create: `skills/shot-detail/SKILL.md`
- Create: `skills/shot-detail/scripts/validate-shot-details.js`
- Create: `skills/shot-detail/scripts/validate-shot-details.__test__.js`

- [ ] **Write SKILL.md**

```markdown
---
name: shot-detail
description: Use when enriching shots with cinematic parameters (framing, angle, movement, mood, frame prompts). Runs after entity-extraction.
---

# Shot Detail

Enriches each shot in a `shot-list.json` with cinematic parameters: camera shot size, angle, movement, duration, mood tags, atmosphere, VFX type, frame prompts, and dialog lines. Writes `shot-details.json`.

## Inputs

- `<chapter-dir>/shot-list.json` — from `script-breakdown`
- `<chapter-dir>/extraction-report.json` — from `entity-extraction` (provides sceneIds)
- `<chapter-dir>/shot-details.json` — optional, existing details to preserve/update
- `--chapter-dir <path>`

## Dependencies

- `script-breakdown` (shot-list.json)
- `entity-extraction` (extraction-report.json, for sceneIds)

## Workflow

1. Read `shot-list.json` and `extraction-report.json`.
2. For each shot, determine:
   - `cameraShot`: ECU | CU | MCU | MS | MLS | LS | ELS
   - `angle`: EYE_LEVEL | HIGH_ANGLE | LOW_ANGLE | BIRD_EYE | DUTCH | OVER_SHOULDER
   - `movement`: STATIC | PAN | TILT | DOLLY_IN | DOLLY_OUT | TRACK | CRANE | HANDHELD | STEADICAM | ZOOM_IN | ZOOM_OUT
   - `duration` (seconds, integer)
   - `moodTags` (free-form array)
   - `atmosphere` (free-form string)
   - `followAtmosphere` (bool — inherit atmosphere from previous source shot)
   - `vfxType`: NONE | PARTICLES | VOLUMETRIC_FOG | CG_DOUBLE | DIGITAL_ENVIRONMENT | MATTE_PAINTING | FIRE_SMOKE | WATER_SIM | DESTRUCTION | ENERGY_MAGIC | COMPOSITING_CLEANUP | SLOW_MOTION_TIME | OTHER
   - `sceneIds` from `extraction-report.json`
   - `firstFramePrompt`, `lastFramePrompt`, `keyFramePrompt`
   - `dialogLines` (array)
3. Write `shot-details.json`.
4. Validate output.

## Output

- `<chapter-dir>/shot-details.json`

## Validation

```bash
pnpm exec dotenv -- node skills/shot-detail/scripts/validate-shot-details.js --file <path>
```

## Error Handling

- If a shot has multiple scene IDs: pick the dominant scene for atmosphere inheritance.
- If `followAtmosphere: true` but no previous source shot: treat this shot as the source.
```

- [ ] **Write the failing test**

```javascript
// skills/shot-detail/scripts/validate-shot-details.__test__.js
import { it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/shot-detail/scripts/validate-shot-details.js'
function validate(data) {
  const f = join(tmpDir, 'details.json')
  writeFileSync(f, JSON.stringify(data), 'utf8')
  return spawnSync('node', [SCRIPT, '--file', f], { encoding: 'utf8' })
}

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'shot-detail-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

const VALID_DETAIL = {
  shotIndex: 1, cameraShot: 'MS', angle: 'EYE_LEVEL', movement: 'STATIC',
  sceneIds: ['scene_abc'], duration: 4, moodTags: ['melancholic'],
  atmosphere: 'dim stage lights', followAtmosphere: false, hasBgm: true,
  vfxType: 'NONE', vfxNote: '', description: 'Wide shot of stage',
  promptTemplateId: null, firstFramePrompt: '', lastFramePrompt: '', keyFramePrompt: '',
  dialogLines: [],
}

const VALID = {
  $schemaVersion: '1.0', chapterId: 'chap_abc',
  generatedAt: '2026-03-27T00:00:00Z', details: [VALID_DETAIL],
}

it('accepts valid shot details', () => { expect(validate(VALID).status).toBe(0) })
it('rejects missing $schemaVersion', () => { const d = { ...VALID }; delete d.$schemaVersion; expect(validate(d).status).toBe(1) })
it('rejects unknown $schemaVersion', () => { expect(validate({ ...VALID, $schemaVersion: '2.0' }).status).toBe(1) })
it('rejects non-array details', () => { expect(validate({ ...VALID, details: 'bad' }).status).toBe(1) })
it('rejects detail with invalid cameraShot', () => {
  expect(validate({ ...VALID, details: [{ ...VALID_DETAIL, cameraShot: 'EXTREME' }] }).status).toBe(1)
})
it('rejects detail with non-integer duration', () => {
  expect(validate({ ...VALID, details: [{ ...VALID_DETAIL, duration: 1.5 }] }).status).toBe(1)
})
it('rejects detail with non-array sceneIds', () => {
  expect(validate({ ...VALID, details: [{ ...VALID_DETAIL, sceneIds: 'bad' }] }).status).toBe(1)
})
it('exits 1 when --file missing', () => {
  expect(spawnSync('node', [SCRIPT], { encoding: 'utf8' }).status).toBe(1)
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm exec vitest run skills/shot-detail/scripts/validate-shot-details.__test__.js
```

- [ ] **Write the implementation**

```javascript
// skills/shot-detail/scripts/validate-shot-details.js
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const SCHEMA_VERSION = '1.0'
const CAMERA_SHOTS = ['ECU', 'CU', 'MCU', 'MS', 'MLS', 'LS', 'ELS']
const ANGLES = ['EYE_LEVEL', 'HIGH_ANGLE', 'LOW_ANGLE', 'BIRD_EYE', 'DUTCH', 'OVER_SHOULDER']
const MOVEMENTS = ['STATIC', 'PAN', 'TILT', 'DOLLY_IN', 'DOLLY_OUT', 'TRACK', 'CRANE', 'HANDHELD', 'STEADICAM', 'ZOOM_IN', 'ZOOM_OUT']
const VFX_TYPES = ['NONE', 'PARTICLES', 'VOLUMETRIC_FOG', 'CG_DOUBLE', 'DIGITAL_ENVIRONMENT', 'MATTE_PAINTING', 'FIRE_SMOKE', 'WATER_SIM', 'DESTRUCTION', 'ENERGY_MAGIC', 'COMPOSITING_CLEANUP', 'SLOW_MOTION_TIME', 'OTHER']

function validate(data) {
  if (data.$schemaVersion === undefined) throw new Error('Missing $schemaVersion')
  if (data.$schemaVersion !== SCHEMA_VERSION) throw new Error(`Unknown $schemaVersion: ${data.$schemaVersion}`)
  if (!data.chapterId || typeof data.chapterId !== 'string') throw new Error('Missing chapterId')
  if (!data.generatedAt || typeof data.generatedAt !== 'string') throw new Error('Missing generatedAt')
  if (!Array.isArray(data.details)) throw new Error('details must be an array')
  for (const [i, d] of data.details.entries()) {
    if (typeof d.shotIndex !== 'number') throw new Error(`details[${i}].shotIndex must be a number`)
    if (!CAMERA_SHOTS.includes(d.cameraShot)) throw new Error(`details[${i}].cameraShot must be one of: ${CAMERA_SHOTS.join(', ')}`)
    if (!ANGLES.includes(d.angle)) throw new Error(`details[${i}].angle must be one of: ${ANGLES.join(', ')}`)
    if (!MOVEMENTS.includes(d.movement)) throw new Error(`details[${i}].movement must be one of: ${MOVEMENTS.join(', ')}`)
    if (!Array.isArray(d.sceneIds)) throw new Error(`details[${i}].sceneIds must be an array`)
    if (!Number.isInteger(d.duration)) throw new Error(`details[${i}].duration must be an integer`)
    if (!Array.isArray(d.moodTags)) throw new Error(`details[${i}].moodTags must be an array`)
    if (typeof d.followAtmosphere !== 'boolean') throw new Error(`details[${i}].followAtmosphere must be a boolean`)
    if (!VFX_TYPES.includes(d.vfxType)) throw new Error(`details[${i}].vfxType must be one of: ${VFX_TYPES.join(', ')}`)
    if (!Array.isArray(d.dialogLines)) throw new Error(`details[${i}].dialogLines must be an array`)
  }
}

function main() {
  const { values } = parseArgs({ args: process.argv.slice(2), options: { file: { type: 'string' } }, strict: false })
  if (!values.file) { process.stderr.write('Missing required flag: --file\n'); process.exit(1) }
  let data
  try { data = JSON.parse(readFileSync(values.file, 'utf8')) }
  catch (e) { process.stderr.write(`Failed to read file: ${e.message}\n`); process.exit(1) }
  try { validate(data); process.exit(0) }
  catch (e) { process.stderr.write(e.message + '\n'); process.exit(1) }
}

main()
```

- [ ] **Run test to verify it passes**

```bash
pnpm exec vitest run skills/shot-detail/scripts/validate-shot-details.__test__.js
```

- [ ] **Commit**

```bash
git add skills/shot-detail/
git commit -m "feat: add shot-detail skill"
```

---

## Task 12: consistency-check

**Files:**
- Create: `skills/consistency-check/SKILL.md`
- Create: `skills/consistency-check/scripts/validate-consistency-report.js`
- Create: `skills/consistency-check/scripts/validate-consistency-report.__test__.js`

- [ ] **Write SKILL.md**

```markdown
---
name: consistency-check
description: Use when detecting character/scene drift across shots after shot-detail is complete. Produces a consistency report and optional optimized shot list.
---

# Consistency Check

Reads shot-list, shot-details, extraction-report, and referenced pack files to detect visual inconsistencies across shots. Produces a `consistency-report.json` with issues and an optional `optimizedShotList`.

## Inputs

- `<chapter-dir>/shot-list.json`
- `<chapter-dir>/shot-details.json`
- `<chapter-dir>/extraction-report.json`
- Referenced pack files under `<base-dir>/global/`
- `--chapter-dir <path>`, `--base-dir <path>`

## Dependencies

- `script-breakdown`, `entity-extraction`, `shot-detail` must all be complete.

## Workflow

1. Read all three chapter files and referenced packs.
2. Check for `character_drift`: same actor described differently in different shots.
3. Check for `scene_drift`: same scene described differently across shots.
4. Check for `prop_mismatch`: prop appears in shot entity refs but not in character composition.
5. Check for `costume_change_unintended`: costume changes without a scene change marker.
6. Check for `style_deviation`: atmosphere or mood-tag drift across consecutive shots with `followAtmosphere: true`.
7. For each issue, record: type, shotIndices, entityId, entityType, description, suggestion.
8. If issues require shot list changes, produce `optimizedShotList` with corrections applied.
9. Write `consistency-report.json`.
10. Validate output.
11. Present issues to user. If `optimizedShotList` is produced, ask before overwriting `shot-list.json`.

## Output

- `<chapter-dir>/consistency-report.json`

## Validation

```bash
pnpm exec dotenv -- node skills/consistency-check/scripts/validate-consistency-report.js --file <path>
```

## Error Handling

- Never auto-apply `optimizedShotList` — always present to user first.
- If no issues found: write report with empty `issues` array and `optimizedShotList: null`.
```

- [ ] **Write the failing test**

```javascript
// skills/consistency-check/scripts/validate-consistency-report.__test__.js
import { it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/consistency-check/scripts/validate-consistency-report.js'
function validate(data) {
  const f = join(tmpDir, 'report.json')
  writeFileSync(f, JSON.stringify(data), 'utf8')
  return spawnSync('node', [SCRIPT, '--file', f], { encoding: 'utf8' })
}

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'consistency-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

const VALID_ISSUE = {
  type: 'character_drift', shotIndices: [3, 7], entityId: 'actor_abc',
  entityType: 'actor', description: 'Hair color mismatch', suggestion: 'Standardize',
}

const VALID = {
  $schemaVersion: '1.0', chapterId: 'chap_abc',
  generatedAt: '2026-03-27T00:00:00Z', issues: [VALID_ISSUE], optimizedShotList: null,
}

it('accepts valid report with issues', () => { expect(validate(VALID).status).toBe(0) })
it('accepts valid report with no issues', () => { expect(validate({ ...VALID, issues: [] }).status).toBe(0) })
it('rejects missing $schemaVersion', () => { const d = { ...VALID }; delete d.$schemaVersion; expect(validate(d).status).toBe(1) })
it('rejects unknown $schemaVersion', () => { expect(validate({ ...VALID, $schemaVersion: '2.0' }).status).toBe(1) })
it('rejects non-array issues', () => { expect(validate({ ...VALID, issues: 'bad' }).status).toBe(1) })
it('rejects issue with invalid type', () => {
  expect(validate({ ...VALID, issues: [{ ...VALID_ISSUE, type: 'unknown_type' }] }).status).toBe(1)
})
it('rejects issue with non-array shotIndices', () => {
  expect(validate({ ...VALID, issues: [{ ...VALID_ISSUE, shotIndices: 3 }] }).status).toBe(1)
})
it('exits 1 when --file missing', () => {
  expect(spawnSync('node', [SCRIPT], { encoding: 'utf8' }).status).toBe(1)
})
```

- [ ] **Run test to verify it fails**

```bash
pnpm exec vitest run skills/consistency-check/scripts/validate-consistency-report.__test__.js
```

- [ ] **Write the implementation**

```javascript
// skills/consistency-check/scripts/validate-consistency-report.js
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const SCHEMA_VERSION = '1.0'
const VALID_ISSUE_TYPES = ['character_drift', 'scene_drift', 'prop_mismatch', 'costume_change_unintended', 'style_deviation']

function validate(data) {
  if (data.$schemaVersion === undefined) throw new Error('Missing $schemaVersion')
  if (data.$schemaVersion !== SCHEMA_VERSION) throw new Error(`Unknown $schemaVersion: ${data.$schemaVersion}`)
  if (!data.chapterId || typeof data.chapterId !== 'string') throw new Error('Missing chapterId')
  if (!data.generatedAt || typeof data.generatedAt !== 'string') throw new Error('Missing generatedAt')
  if (!Array.isArray(data.issues)) throw new Error('issues must be an array')
  for (const [i, issue] of data.issues.entries()) {
    if (!VALID_ISSUE_TYPES.includes(issue.type)) {
      throw new Error(`issues[${i}].type must be one of: ${VALID_ISSUE_TYPES.join(', ')}`)
    }
    if (!Array.isArray(issue.shotIndices)) throw new Error(`issues[${i}].shotIndices must be an array`)
    if (typeof issue.entityId !== 'string') throw new Error(`issues[${i}].entityId must be a string`)
    if (typeof issue.description !== 'string') throw new Error(`issues[${i}].description must be a string`)
  }
  // optimizedShotList is null or a shot-list-compatible object — just check it's not undefined
  if (!('optimizedShotList' in data)) throw new Error('Missing optimizedShotList (use null if no optimization)')
}

function main() {
  const { values } = parseArgs({ args: process.argv.slice(2), options: { file: { type: 'string' } }, strict: false })
  if (!values.file) { process.stderr.write('Missing required flag: --file\n'); process.exit(1) }
  let data
  try { data = JSON.parse(readFileSync(values.file, 'utf8')) }
  catch (e) { process.stderr.write(`Failed to read file: ${e.message}\n`); process.exit(1) }
  try { validate(data); process.exit(0) }
  catch (e) { process.stderr.write(e.message + '\n'); process.exit(1) }
}

main()
```

- [ ] **Run test to verify it passes**

```bash
pnpm exec vitest run skills/consistency-check/scripts/validate-consistency-report.__test__.js
```

- [ ] **Commit**

```bash
git add skills/consistency-check/
git commit -m "feat: add consistency-check skill"
```

---

## Task 13: production-pipeline

**Files:**
- Create: `skills/production-pipeline/SKILL.md`
- Create: `skills/production-pipeline/references/workflow.md`

No scripts. No tests. Pure instruction files.

- [ ] **Write SKILL.md**

```markdown
---
name: production-pipeline
description: Use when orchestrating script-breakdown → entity-extraction → shot-detail → consistency-check for a chapter. Runs all four reasoning skills in sequence.
---

# Production Pipeline

Orchestrates the four reasoning skills for a single chapter. Call this skill instead of calling each reasoning skill individually. It manages sequencing, passes outputs between steps, and presents consistency issues for user review before proceeding.

## Inputs

- Raw text (lyrics, screenplay, story brief) OR existing `chapter.json` with `rawText`
- `--base-dir <path>` — project root
- `--chapter-dir <path>` — e.g. `<base-dir>/chapters/<chapter-id>` (create the directory if it does not exist)

## Workflow

Follow `skills/production-pipeline/references/workflow.md` step by step.

## Output

All four reasoning skill outputs for the chapter:
- `chapter.json`, `shot-list.json`, `extraction-report.json`, `shot-details.json`, `consistency-report.json`
- Pack files under `<base-dir>/global/` and `<base-dir>/characters/`

## Error Handling

- Stop between steps if any validator exits non-zero. Show the error and ask the user how to proceed.
- After consistency-check: if `optimizedShotList` is non-null, present it to the user and ask before overwriting `shot-list.json`. If user approves, re-run shot-detail and consistency-check on the updated shot list.
```

- [ ] **Write references/workflow.md**

```markdown
# Chapter Production Workflow

## Step 1 — Script Breakdown

- Skill: `script-breakdown`
- Input: raw text (provided by user or read from `chapter.json#rawText`)
- Output: `<chapter-dir>/chapter.json`, `<chapter-dir>/shot-list.json`
- Validation: `pnpm exec dotenv -- node skills/script-breakdown/scripts/validate-shot-list.js --file <chapter-dir>/shot-list.json`
- Decision: if condensedText significantly changes the meaning of the source text, show both to the user and ask to confirm before continuing.

## Step 2 — Entity Extraction

- Skill: `entity-extraction`
- Input: `<chapter-dir>/shot-list.json`
- Output: pack files under `<base-dir>/global/` and `<base-dir>/characters/`, `<chapter-dir>/extraction-report.json`
- Validation: `pnpm exec dotenv -- node skills/entity-extraction/scripts/validate-extraction-report.js --file <chapter-dir>/extraction-report.json`
- Decision: for each new entity name, run `list --filter <name>` on the relevant pack script before creating. Fuzzy-match by name to avoid duplicates. If multiple matches, present options to user.

## Step 3 — Shot Detail

- Skill: `shot-detail`
- Input: `<chapter-dir>/shot-list.json`, `<chapter-dir>/extraction-report.json`
- Output: `<chapter-dir>/shot-details.json`
- Validation: `pnpm exec dotenv -- node skills/shot-detail/scripts/validate-shot-details.js --file <chapter-dir>/shot-details.json`
- Decision: for shots with multiple sceneIds, pick the dominant scene for atmosphere inheritance. If a shot has `followAtmosphere: true` but no preceding source shot, treat it as a source shot.

## Step 4 — Consistency Check

- Skill: `consistency-check`
- Input: `<chapter-dir>/shot-list.json`, `<chapter-dir>/shot-details.json`, `<chapter-dir>/extraction-report.json`, referenced pack files
- Output: `<chapter-dir>/consistency-report.json`
- Validation: `pnpm exec dotenv -- node skills/consistency-check/scripts/validate-consistency-report.js --file <chapter-dir>/consistency-report.json`
- Decision: if issues found, present them to the user. If `optimizedShotList` is non-null, ask: "Apply the optimized shot list? (Y/N)". If yes, overwrite `shot-list.json` and re-run Steps 3 and 4. If no, continue with current shot list.
```

- [ ] **Run all new tests to confirm everything passes**

```bash
pnpm exec vitest run skills/lib/ skills/generating-actor-pack/ skills/generating-scene-pack/ skills/generating-prop-pack/ skills/generating-costume-pack/ skills/generating-character-pack/ skills/prompt-template/ skills/script-breakdown/ skills/entity-extraction/ skills/shot-detail/ skills/consistency-check/
```

Expected: all tests PASS.

- [ ] **Commit**

```bash
git add skills/production-pipeline/
git commit -m "feat: add production-pipeline skill"
```

---

## Final: Verify full test suite

- [ ] **Run pnpm test and confirm no regressions in new skills**

```bash
pnpm test 2>&1 | tail -20
```

Expected: all new skill tests pass. (Existing skill tests may still fail — they used CJS `require()` in ESM test files before this work began and are out of scope for Phase A.)

- [ ] **Push feature branch**

```bash
git push
```

---

## Spec Coverage Check

| Spec requirement | Covered by |
|---|---|
| 6 pack management skills with CRUD scripts + tests | Tasks 3–8 |
| Character pack validates actor-id exists | Task 7 |
| Prompt template uses template.json (not pack.json) | Task 8 |
| 4 reasoning skill validators | Tasks 9–12 |
| production-pipeline SKILL.md + workflow.md | Task 13 |
| Fix vitest.config.js | Task 0 |
| Fix 4 broken README links | Task 1 |
| Shared ID generation (prefix_base36) | Task 2 |
| Schema versioning ($schemaVersion: "1.0") | Tasks 2–12 |
| All scripts output JSON to stdout, errors to stderr | Tasks 3–8 |
| All validators exit 0/1 | Tasks 9–12 |
| Design doc: remove workflow skill script restriction | Already committed in brainstorming phase |
