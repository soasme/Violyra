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
