// skills/lib/pack-utils.js
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, isAbsolute } from 'node:path'

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

export function resolveAsset(projectDir, relativePath) {
  let assetDirs = ['.']
  const projectJsonPath = join(projectDir, 'project.json')
  if (existsSync(projectJsonPath)) {
    try {
      const config = JSON.parse(readFileSync(projectJsonPath, 'utf8'))
      if (Array.isArray(config.assetDirs)) assetDirs = config.assetDirs
    } catch {}
  }
  for (const dir of assetDirs) {
    const base = isAbsolute(dir) ? dir : join(projectDir, dir)
    const candidate = join(base, relativePath)
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
