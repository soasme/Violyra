// skills/enriching-shot-details/scripts/validate-shot-details.__test__.js
import { it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/enriching-shot-details/scripts/validate-shot-details.js'
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
it('rejects detail with non-boolean hasBgm', () => {
  expect(validate({ ...VALID, details: [{ ...VALID_DETAIL, hasBgm: 'yes' }] }).status).toBe(1)
})
it('rejects detail with non-string atmosphere', () => {
  expect(validate({ ...VALID, details: [{ ...VALID_DETAIL, atmosphere: 123 }] }).status).toBe(1)
})
it('rejects detail with non-string firstFramePrompt', () => {
  expect(validate({ ...VALID, details: [{ ...VALID_DETAIL, firstFramePrompt: null }] }).status).toBe(1)
})
it('exits 1 when --file missing', () => {
  expect(spawnSync('node', [SCRIPT], { encoding: 'utf8' }).status).toBe(1)
})
