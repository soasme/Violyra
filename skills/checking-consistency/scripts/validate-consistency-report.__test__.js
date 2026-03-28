// skills/consistency-check/scripts/validate-consistency-report.__test__.js
import { it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/checking-consistency/scripts/validate-consistency-report.js'
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
it('rejects issue with non-string entityType', () => {
  expect(validate({ ...VALID, issues: [{ ...VALID_ISSUE, entityType: 123 }] }).status).toBe(1)
})
it('rejects issue with non-string suggestion', () => {
  expect(validate({ ...VALID, issues: [{ ...VALID_ISSUE, suggestion: null }] }).status).toBe(1)
})
it('exits 1 when --file missing', () => {
  expect(spawnSync('node', [SCRIPT], { encoding: 'utf8' }).status).toBe(1)
})
