// skills/lib/pack-utils.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  SCHEMA_VERSION,
  generateId,
  readPack,
  writePack,
  listPacksInDir,
} from './pack-utils.js'

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'pack-utils-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

describe('SCHEMA_VERSION', () => {
  it('is 1.0', () => { expect(SCHEMA_VERSION).toBe('1.0') })
})

describe('generateId', () => {
  it('returns prefix_base36timestamp', () => {
    const id = generateId('actor')
    expect(id).toMatch(/^actor_[0-9a-z]+$/)
  })
  it('generates unique ids', () => {
    const ids = Array.from({ length: 10 }, () => generateId('x'))
    expect(new Set(ids).size).toBe(10)
  })
})

describe('writePack / readPack', () => {
  it('round-trips a pack', () => {
    const path = join(tmpDir, 'sub', 'pack.json')
    const data = { $schemaVersion: '1.0', id: 'actor_abc', name: 'Mia' }
    writePack(path, data)
    const loaded = readPack(path)
    expect(loaded.name).toBe('Mia')
  })
  it('throws on unknown schemaVersion', () => {
    const path = join(tmpDir, 'pack.json')
    writePack(path, { $schemaVersion: '99.0', id: 'x' })
    expect(() => readPack(path)).toThrow('Unknown $schemaVersion')
  })
  it('throws when file does not exist', () => {
    expect(() => readPack(join(tmpDir, 'missing.json'))).toThrow('not found')
  })
})

describe('listPacksInDir', () => {
  it('returns empty array when dir does not exist', () => {
    expect(listPacksInDir(join(tmpDir, 'nonexistent'))).toEqual([])
  })
  it('lists pack.json files from subdirectories', () => {
    writePack(join(tmpDir, 'actor_a', 'pack.json'), { $schemaVersion: '1.0', id: 'actor_a', name: 'A' })
    writePack(join(tmpDir, 'actor_b', 'pack.json'), { $schemaVersion: '1.0', id: 'actor_b', name: 'B' })
    const packs = listPacksInDir(tmpDir)
    expect(packs).toHaveLength(2)
    expect(packs.map(p => p.name).sort()).toEqual(['A', 'B'])
  })
})
