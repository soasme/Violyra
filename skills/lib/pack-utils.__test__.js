// skills/lib/pack-utils.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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
  it('finds asset in project dir when no SPEC.md exists', () => {
    writeFileSync(join(tmpDir, 'image.png'), 'data')
    const result = resolveAsset(tmpDir, 'image.png')
    expect(result).toBe(join(tmpDir, 'image.png'))
  })

  it('finds asset in project dir when SPEC.md asset directories include "."', () => {
    writeFileSync(join(tmpDir, 'SPEC.md'), '# Spec\n\n## Asset Directories\n- `.`\n')
    writeFileSync(join(tmpDir, 'image.png'), 'data')
    const result = resolveAsset(tmpDir, 'image.png')
    expect(result).toBe(join(tmpDir, 'image.png'))
  })

  it('uses the standard asset buckets by default', () => {
    mkdirSync(join(tmpDir, 'assets', 'images'), { recursive: true })
    writeFileSync(join(tmpDir, 'assets', 'images', 'image.png'), 'data')
    const result = resolveAsset(tmpDir, 'image.png')
    expect(result).toBe(join(tmpDir, 'assets', 'images', 'image.png'))
  })

  it('falls back to external dir when not found locally and listed in SPEC.md', () => {
    const ext = mkdtempSync(join(tmpdir(), 'ext-'))
    try {
      writeFileSync(join(ext, 'shared.png'), 'data')
      writeFileSync(join(tmpDir, 'SPEC.md'), `# Spec\n\n## Asset Directories\n- \`.\`\n- \`${ext}\`\n`)
      expect(resolveAsset(tmpDir, 'shared.png')).toBe(join(ext, 'shared.png'))
    } finally {
      rmSync(ext, { recursive: true, force: true })
    }
  })

  it('returns local file over external when both exist in SPEC.md asset directories', () => {
    const ext = mkdtempSync(join(tmpdir(), 'ext-'))
    try {
      writeFileSync(join(tmpDir, 'image.png'), 'local')
      writeFileSync(join(ext, 'image.png'), 'external')
      writeFileSync(join(tmpDir, 'SPEC.md'), `# Spec\n\n## Asset Directories\n- \`.\`\n- \`${ext}\`\n`)
      expect(resolveAsset(tmpDir, 'image.png')).toBe(join(tmpDir, 'image.png'))
    } finally {
      rmSync(ext, { recursive: true, force: true })
    }
  })

  it('throws when asset not found in any SPEC.md asset directory', () => {
    writeFileSync(join(tmpDir, 'SPEC.md'), '# Spec\n\n## Asset Directories\n- `.`\n')
    expect(() => resolveAsset(tmpDir, 'missing.png')).toThrow('Asset not found: missing.png')
  })

  it('ignores unrelated JSON files and still uses default asset directories', () => {
    writeFileSync(join(tmpDir, 'notes.json'), '{"hello":"world"}')
    writeFileSync(join(tmpDir, 'legacy.png'), 'data')
    expect(resolveAsset(tmpDir, 'legacy.png')).toBe(join(tmpDir, 'legacy.png'))
  })

  it('rejects absolute asset paths', () => {
    expect(() => resolveAsset(tmpDir, '/tmp/image.png')).toThrow('Asset path must be relative: /tmp/image.png')
  })

  it('rejects paths that escape the asset dir', () => {
    writeFileSync(join(tmpDir, '..', 'outside.png'), 'data')
    expect(() => resolveAsset(tmpDir, '../outside.png')).toThrow('Asset path escapes asset dir: ../outside.png')
  })
})
