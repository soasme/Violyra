// skills/lib/manifest-utils.__test__.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  computeCacheKey,
  readManifest,
  writeManifest,
  findEntry,
  isEntryValid,
  addEntry,
} from './manifest-utils.js'

let tmpDir

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'manifest-'))
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('computeCacheKey', () => {
  it('returns a sha256: prefixed hex string', () => {
    const key = computeCacheKey('a prompt', 'model-x', { resolution: '1080p' })
    expect(key).toMatch(/^sha256:[0-9a-f]{64}$/)
  })

  it('is deterministic for same inputs', () => {
    const a = computeCacheKey('prompt', 'model', { seed: 1, res: '720p' })
    const b = computeCacheKey('prompt', 'model', { seed: 1, res: '720p' })
    expect(a).toBe(b)
  })

  it('is stable regardless of params key order', () => {
    const a = computeCacheKey('prompt', 'model', { seed: 1, res: '720p' })
    const b = computeCacheKey('prompt', 'model', { res: '720p', seed: 1 })
    expect(a).toBe(b)
  })

  it('differs when prompt changes', () => {
    const a = computeCacheKey('prompt A', 'model', {})
    const b = computeCacheKey('prompt B', 'model', {})
    expect(a).not.toBe(b)
  })

  it('differs when model changes', () => {
    const a = computeCacheKey('prompt', 'model-a', {})
    const b = computeCacheKey('prompt', 'model-b', {})
    expect(a).not.toBe(b)
  })

  it('differs when params change', () => {
    const a = computeCacheKey('prompt', 'model', { seed: 1 })
    const b = computeCacheKey('prompt', 'model', { seed: 2 })
    expect(a).not.toBe(b)
  })
})

describe('readManifest', () => {
  it('returns empty manifest when file does not exist', () => {
    expect(readManifest(tmpDir)).toEqual({ $schemaVersion: '1.0', entries: [] })
  })

  it('reads existing manifest', () => {
    const data = { $schemaVersion: '1.0', entries: [{ cache_key: 'sha256:abc', output: 'out.mp4' }] }
    writeFileSync(join(tmpDir, 'manifest.json'), JSON.stringify(data))
    const manifest = readManifest(tmpDir)
    expect(manifest.entries).toHaveLength(1)
    expect(manifest.entries[0].cache_key).toBe('sha256:abc')
  })

  it('returns empty manifest when file is invalid JSON', () => {
    writeFileSync(join(tmpDir, 'manifest.json'), '{not valid json')
    expect(readManifest(tmpDir)).toEqual({ $schemaVersion: '1.0', entries: [] })
  })

  it('returns empty manifest when schema version is unknown', () => {
    writeFileSync(join(tmpDir, 'manifest.json'), JSON.stringify({ $schemaVersion: '9.9', entries: [] }))
    expect(readManifest(tmpDir)).toEqual({ $schemaVersion: '1.0', entries: [] })
  })

  it('normalizes missing entries to an empty array', () => {
    writeFileSync(join(tmpDir, 'manifest.json'), JSON.stringify({ $schemaVersion: '1.0' }))
    expect(readManifest(tmpDir)).toEqual({ $schemaVersion: '1.0', entries: [] })
  })
})

describe('writeManifest / readManifest round-trip', () => {
  it('persists and restores manifest', () => {
    const manifest = { $schemaVersion: '1.0', entries: [{ cache_key: 'sha256:abc', output: 'shot.mp4' }] }
    writeManifest(tmpDir, manifest)
    expect(readManifest(tmpDir)).toEqual(manifest)
  })
})

describe('findEntry', () => {
  it('returns matching entry by cache_key', () => {
    const manifest = { $schemaVersion: '1.0', entries: [
      { cache_key: 'sha256:aaa', output: 'a.mp4' },
      { cache_key: 'sha256:bbb', output: 'b.mp4' },
    ] }
    expect(findEntry(manifest, 'sha256:bbb').output).toBe('b.mp4')
  })

  it('returns null when not found', () => {
    expect(findEntry({ $schemaVersion: '1.0', entries: [] }, 'sha256:xyz')).toBeNull()
  })
})

describe('isEntryValid', () => {
  it('returns true when output file exists', () => {
    writeFileSync(join(tmpDir, 'shot.mp4'), 'video')
    expect(isEntryValid({ output: 'shot.mp4' }, tmpDir)).toBe(true)
  })

  it('returns false when output file is missing', () => {
    expect(isEntryValid({ output: 'missing.mp4' }, tmpDir)).toBe(false)
  })

  it('returns false for absolute output paths', () => {
    writeFileSync(join(tmpDir, 'shot.mp4'), 'video')
    expect(isEntryValid({ output: join(tmpDir, 'shot.mp4') }, tmpDir)).toBe(false)
  })

  it('returns false when output path escapes projectDir', () => {
    writeFileSync(join(tmpDir, '..', 'outside.mp4'), 'video')
    expect(isEntryValid({ output: '../outside.mp4' }, tmpDir)).toBe(false)
  })
})

describe('addEntry', () => {
  it('appends entry and does not mutate original', () => {
    const manifest = { $schemaVersion: '1.0', entries: [] }
    const entry = { cache_key: 'sha256:abc', output: 'shot.mp4', created_at: '2026-03-29T00:00:00Z' }
    const updated = addEntry(manifest, entry)
    expect(updated.entries).toHaveLength(1)
    expect(manifest.entries).toHaveLength(0)
  })
})
