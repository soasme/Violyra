// skills/retention-driven-development/scripts/validate-retention-report.__test__.js
import { it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/retention-driven-development/scripts/validate-retention-report.js'

function validate(data) {
  const f = join(tmpDir, 'report.json')
  writeFileSync(f, JSON.stringify(data), 'utf8')
  return spawnSync('node', [SCRIPT, '--file', f], { encoding: 'utf8' })
}

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'retention-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

const VALID_SHOT = { shotIndex: 1, score: 75, status: 'pass', regenerated: false }

const VALID = {
  $schemaVersion: '1.0',
  chapterId: 'chap_abc',
  generatedAt: '2026-03-28T00:00:00Z',
  threshold: 60,
  iterations: 2,
  shotScores: [VALID_SHOT],
  passCount: 1,
  failCount: 0,
}

it('accepts valid report', () => { expect(validate(VALID).status).toBe(0) })
it('rejects missing $schemaVersion', () => { const d = { ...VALID }; delete d.$schemaVersion; expect(validate(d).status).toBe(1) })
it('rejects unknown $schemaVersion', () => { expect(validate({ ...VALID, $schemaVersion: '2.0' }).status).toBe(1) })
it('rejects missing chapterId', () => { const d = { ...VALID }; delete d.chapterId; expect(validate(d).status).toBe(1) })
it('rejects missing generatedAt', () => { const d = { ...VALID }; delete d.generatedAt; expect(validate(d).status).toBe(1) })
it('rejects non-number threshold', () => { expect(validate({ ...VALID, threshold: 'sixty' }).status).toBe(1) })
it('rejects non-number iterations', () => { expect(validate({ ...VALID, iterations: '2' }).status).toBe(1) })
it('rejects non-array shotScores', () => { expect(validate({ ...VALID, shotScores: {} }).status).toBe(1) })
it('rejects shot with non-number shotIndex', () => {
  expect(validate({ ...VALID, shotScores: [{ ...VALID_SHOT, shotIndex: 'one' }] }).status).toBe(1)
})
it('rejects shot with score out of range', () => {
  expect(validate({ ...VALID, shotScores: [{ ...VALID_SHOT, score: 150 }] }).status).toBe(1)
})
it('rejects shot with invalid status', () => {
  expect(validate({ ...VALID, shotScores: [{ ...VALID_SHOT, status: 'maybe' }] }).status).toBe(1)
})
it('rejects shot with non-boolean regenerated', () => {
  expect(validate({ ...VALID, shotScores: [{ ...VALID_SHOT, regenerated: 'yes' }] }).status).toBe(1)
})
it('rejects non-number passCount', () => { expect(validate({ ...VALID, passCount: '1' }).status).toBe(1) })
it('rejects non-number failCount', () => { expect(validate({ ...VALID, failCount: null }).status).toBe(1) })
it('exits 1 when --file missing', () => {
  expect(spawnSync('node', [SCRIPT], { encoding: 'utf8' }).status).toBe(1)
})
