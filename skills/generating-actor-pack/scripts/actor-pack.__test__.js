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
