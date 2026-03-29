// skills/lib/pack-utils.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  SCHEMA_VERSION,
  generateId,
  readPack,
  writePack,
  listPacksInDir,
  resolveAsset,
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

describe('resolveAsset', () => {
  it('finds asset in project dir when no project.json exists', () => {
    writeFileSync(join(tmpDir, 'image.png'), 'data')
    const result = resolveAsset(tmpDir, 'image.png')
    expect(result).toBe(join(tmpDir, 'image.png'))
  })

  it('finds asset in project dir when assetDirs is ["."]', () => {
    writeFileSync(join(tmpDir, 'project.json'), JSON.stringify({ $schemaVersion: '1.0', assetDirs: ['.'] }))
    writeFileSync(join(tmpDir, 'image.png'), 'data')
    const result = resolveAsset(tmpDir, 'image.png')
    expect(result).toBe(join(tmpDir, 'image.png'))
  })

  it('falls back to external dir when not found locally', () => {
    const ext = mkdtempSync(join(tmpdir(), 'ext-'))
    try {
      writeFileSync(join(ext, 'shared.png'), 'data')
      writeFileSync(join(tmpDir, 'project.json'), JSON.stringify({
        $schemaVersion: '1.0',
        assetDirs: ['.', ext]
      }))
      expect(resolveAsset(tmpDir, 'shared.png')).toBe(join(ext, 'shared.png'))
    } finally {
      rmSync(ext, { recursive: true, force: true })
    }
  })

  it('returns local file over external when both exist', () => {
    const ext = mkdtempSync(join(tmpdir(), 'ext-'))
    try {
      writeFileSync(join(tmpDir, 'image.png'), 'local')
      writeFileSync(join(ext, 'image.png'), 'external')
      writeFileSync(join(tmpDir, 'project.json'), JSON.stringify({
        $schemaVersion: '1.0',
        assetDirs: ['.', ext]
      }))
      expect(resolveAsset(tmpDir, 'image.png')).toBe(join(tmpDir, 'image.png'))
    } finally {
      rmSync(ext, { recursive: true, force: true })
    }
  })

  it('throws when asset not found in any dir', () => {
    writeFileSync(join(tmpDir, 'project.json'), JSON.stringify({ $schemaVersion: '1.0', assetDirs: ['.'] }))
    expect(() => resolveAsset(tmpDir, 'missing.png')).toThrow('Asset not found: missing.png')
  })
})
