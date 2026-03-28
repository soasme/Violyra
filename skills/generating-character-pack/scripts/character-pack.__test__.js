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
  it('update exits 1 when new actor-id does not exist', () => {
    const actor = createActor()
    const id = JSON.parse(run(CHAR_SCRIPT, 'create', '--base-dir', tmpDir, '--name', 'Role', '--actor-id', actor.id).stdout).id
    const r = run(CHAR_SCRIPT, 'update', '--base-dir', tmpDir, '--id', id, '--actor-id', 'actor_notexist')
    expect(r.status).toBe(1)
    expect(JSON.parse(r.stderr).error).toContain('actor')
  })
  it('delete exits 1 for non-existent id', () => {
    const r = run(CHAR_SCRIPT, 'delete', '--base-dir', tmpDir, '--id', 'char_notexist')
    expect(r.status).toBe(1)
    expect(JSON.parse(r.stderr).error).toContain('not found')
  })
  it('list returns all characters', () => {
    const actor = createActor()
    run(CHAR_SCRIPT, 'create', '--base-dir', tmpDir, '--name', 'A', '--actor-id', actor.id)
    run(CHAR_SCRIPT, 'create', '--base-dir', tmpDir, '--name', 'B', '--actor-id', actor.id)
    expect(JSON.parse(run(CHAR_SCRIPT, 'list', '--base-dir', tmpDir).stdout)).toHaveLength(2)
  })
})
