// skills/extracting-video-entities/scripts/validate-extraction-report.__test__.js
import { it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/extracting-video-entities/scripts/validate-extraction-report.js'
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
it('rejects ref with non-integer shotIndex', () => {
  expect(validate({ ...VALID, shotEntityRefs: [{ ...VALID.shotEntityRefs[0], shotIndex: 1.5 }] }).status).toBe(1)
})
it('rejects ref with non-array actorIds', () => {
  expect(validate({ ...VALID, shotEntityRefs: [{ ...VALID.shotEntityRefs[0], actorIds: 'bad' }] }).status).toBe(1)
})
it('exits 1 when --file missing', () => {
  expect(spawnSync('node', [SCRIPT], { encoding: 'utf8' }).status).toBe(1)
})
