// skills/breaking-down-video-script/scripts/validate-shot-list.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/breaking-down-video-script/scripts/validate-shot-list.js'
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
it('rejects shot with non-integer index', () => {
  expect(validate({ ...VALID, shots: [{ ...VALID.shots[0], index: 1.5 }] }).status).toBe(1)
})
it('rejects shot with invalid status', () => {
  expect(validate({ ...VALID, shots: [{ ...VALID.shots[0], status: 'unknown' }] }).status).toBe(1)
})
it('exits 1 when --file missing', () => {
  expect(spawnSync('node', [SCRIPT], { encoding: 'utf8' }).status).toBe(1)
})
