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
