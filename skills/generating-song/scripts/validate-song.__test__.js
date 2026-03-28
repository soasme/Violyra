// skills/generating-song/scripts/validate-song.__test__.js
import { it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCRIPT = 'skills/generating-song/scripts/validate-song.js'

function run(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' })
}

let tmpDir
beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'song-')) })
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }) })

it('accepts a valid mp3 file', () => {
  const f = join(tmpDir, 'song.mp3')
  writeFileSync(f, 'fake audio content', 'utf8')
  expect(run(['--file', f]).status).toBe(0)
})
it('accepts wav extension', () => {
  const f = join(tmpDir, 'song.wav')
  writeFileSync(f, 'fake audio content', 'utf8')
  expect(run(['--file', f]).status).toBe(0)
})
it('accepts flac extension', () => {
  const f = join(tmpDir, 'song.flac')
  writeFileSync(f, 'fake audio content', 'utf8')
  expect(run(['--file', f]).status).toBe(0)
})
it('accepts m4a extension', () => {
  const f = join(tmpDir, 'song.m4a')
  writeFileSync(f, 'fake audio content', 'utf8')
  expect(run(['--file', f]).status).toBe(0)
})
it('accepts ogg extension', () => {
  const f = join(tmpDir, 'song.ogg')
  writeFileSync(f, 'fake audio content', 'utf8')
  expect(run(['--file', f]).status).toBe(0)
})
it('rejects file that does not exist', () => {
  expect(run(['--file', join(tmpDir, 'missing.mp3')]).status).toBe(1)
})
it('rejects unsupported extension', () => {
  const f = join(tmpDir, 'song.txt')
  writeFileSync(f, 'not audio', 'utf8')
  expect(run(['--file', f]).status).toBe(1)
})
it('rejects empty file', () => {
  const f = join(tmpDir, 'song.mp3')
  writeFileSync(f, '', 'utf8')
  expect(run(['--file', f]).status).toBe(1)
})
it('exits 1 when --file missing', () => {
  expect(run([]).status).toBe(1)
})
