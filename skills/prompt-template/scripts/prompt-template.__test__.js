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
