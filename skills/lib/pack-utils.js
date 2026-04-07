// skills/lib/pack-utils.js
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, isAbsolute, resolve, relative } from 'node:path'

export const SCHEMA_VERSION = '1.0'

let _lastMs = 0
let _idCounter = 0

// Note: collision avoidance is per-process only. Parallel node invocations for the
// same entity type within the same millisecond can produce duplicate IDs. In practice
// this is extremely unlikely given typical filesystem I/O latency.
export function generateId(prefix) {
  const ms = Date.now()
  if (ms === _lastMs) {
    _idCounter++
  } else {
    _lastMs = ms
    _idCounter = 0
  }
  const ts = ms.toString(36)
  return _idCounter === 0 ? `${prefix}_${ts}` : `${prefix}_${ts}_${_idCounter}`
}

export function readPack(filePath) {
  if (!existsSync(filePath)) throw new Error(`Pack not found: ${filePath}`)
  const data = JSON.parse(readFileSync(filePath, 'utf8'))
  if (data.$schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unknown $schemaVersion: ${data.$schemaVersion}`)
  }
  return data
}

export function writePack(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

function resolvePathWithinDir(baseDir, assetPath) {
  if (typeof assetPath !== 'string' || assetPath.length === 0) {
    throw new Error('Asset path must be a non-empty relative path')
  }
  if (isAbsolute(assetPath)) throw new Error(`Asset path must be relative: ${assetPath}`)

  const resolvedBaseDir = resolve(baseDir)
  const candidate = resolve(resolvedBaseDir, assetPath)
  const candidateRelativePath = relative(resolvedBaseDir, candidate)

  if (candidateRelativePath === '' || (!candidateRelativePath.startsWith('..') && !isAbsolute(candidateRelativePath))) {
    return candidate
  }

  throw new Error(`Asset path escapes asset dir: ${assetPath}`)
}

function parseAssetDirsFromSpec(specMarkdown) {
  const lines = specMarkdown.split(/\r?\n/)
  const headingIndex = lines.findIndex(line => /^#{1,6}\s+Asset (Directories|Dirs)\b/i.test(line.trim()))
  if (headingIndex === -1) return null

  const dirs = []
  for (let i = headingIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (/^#{1,6}\s+/.test(trimmed)) break
    if (trimmed.length === 0) continue

    const backtickMatch = trimmed.match(/^[-*]\s+`([^`]+)`(?:\s+[—-]\s+.*)?$/)
    if (backtickMatch) {
      dirs.push(backtickMatch[1])
      continue
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/)
    if (!bulletMatch) continue

    const value = bulletMatch[1].replace(/\s+[—-]\s+.*$/, '').trim()
    if (value.length > 0) dirs.push(value)
  }

  return dirs.length > 0 ? dirs : null
}

function readAssetDirsFromSpec(projectDir) {
  const specPath = join(projectDir, 'SPEC.md')
  if (!existsSync(specPath)) return null
  const specMarkdown = readFileSync(specPath, 'utf8')
  return parseAssetDirsFromSpec(specMarkdown)
}

export function resolveAsset(projectDir, relativePath) {
  const assetDirs =
    readAssetDirsFromSpec(projectDir) ??
    ['.', 'project/assets', 'project/assets/images', 'project/assets/videos', 'project/assets/audios', 'project/assets/fonts']

  for (const dir of assetDirs) {
    const base = isAbsolute(dir) ? dir : join(projectDir, dir)
    const candidate = resolvePathWithinDir(base, relativePath)
    if (existsSync(candidate)) return candidate
  }
  throw new Error(`Asset not found: ${relativePath}`)
}

export function errorExit(msg) {
  process.stderr.write(JSON.stringify({ error: msg }) + '\n')
  process.exit(1)
}

export function successOutput(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n')
}

export function safeParseJson(str, flagName) {
  try {
    return JSON.parse(str)
  } catch {
    errorExit(`Invalid JSON for ${flagName}: expected a valid JSON value`)
  }
}

export function listPacksInDir(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(e => {
      const packPath = join(dir, e.name, 'pack.json')
      if (!existsSync(packPath)) return []
      try { return [readPack(packPath)] }
      catch { return [] }
    })
}
