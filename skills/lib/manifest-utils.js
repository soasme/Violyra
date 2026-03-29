// skills/lib/manifest-utils.js
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve, relative, isAbsolute } from 'node:path'

const MANIFEST_SCHEMA_VERSION = '1.0'

function sortJsonValue(value) {
  if (Array.isArray(value)) return value.map(sortJsonValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, sortJsonValue(value[key])])
    )
  }
  return value
}

function emptyManifest() {
  return { $schemaVersion: MANIFEST_SCHEMA_VERSION, entries: [] }
}

function resolveProjectPath(projectDir, relativePath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) return null
  if (isAbsolute(relativePath)) return null

  const resolvedProjectDir = resolve(projectDir)
  const resolvedPath = resolve(resolvedProjectDir, relativePath)
  const projectRelativePath = relative(resolvedProjectDir, resolvedPath)

  if (projectRelativePath === '' || projectRelativePath.startsWith('..') || isAbsolute(projectRelativePath)) {
    return null
  }

  return resolvedPath
}

export function computeCacheKey(prompt, modelId, params) {
  const payload = JSON.stringify({
    prompt,
    modelId,
    params: sortJsonValue(params),
  })
  return `sha256:${createHash('sha256').update(payload).digest('hex')}`
}

export function readManifest(projectDir) {
  const manifestPath = join(projectDir, 'manifest.json')
  if (!existsSync(manifestPath)) return emptyManifest()

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return emptyManifest()
    if (manifest.$schemaVersion !== MANIFEST_SCHEMA_VERSION) return emptyManifest()

    return {
      ...manifest,
      $schemaVersion: MANIFEST_SCHEMA_VERSION,
      entries: Array.isArray(manifest.entries) ? manifest.entries : [],
    }
  } catch {
    return emptyManifest()
  }
}

export function writeManifest(projectDir, manifest) {
  const normalizedManifest = {
    ...manifest,
    $schemaVersion: MANIFEST_SCHEMA_VERSION,
    entries: Array.isArray(manifest?.entries) ? manifest.entries : [],
  }
  writeFileSync(join(projectDir, 'manifest.json'), `${JSON.stringify(normalizedManifest, null, 2)}\n`, 'utf8')
}

export function findEntry(manifest, cacheKey) {
  const entries = Array.isArray(manifest?.entries) ? manifest.entries : []
  return entries.find(entry => entry.cache_key === cacheKey) ?? null
}

export function isEntryValid(entry, projectDir) {
  const outputPath = resolveProjectPath(projectDir, entry?.output)
  return outputPath ? existsSync(outputPath) : false
}

export function addEntry(manifest, entry) {
  const entries = Array.isArray(manifest?.entries) ? manifest.entries : []
  return {
    ...manifest,
    $schemaVersion: MANIFEST_SCHEMA_VERSION,
    entries: [...entries, entry],
  }
}
