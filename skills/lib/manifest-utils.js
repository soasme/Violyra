// skills/lib/manifest-utils.js
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

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
  return JSON.parse(readFileSync(manifestPath, 'utf8'))
}

export function writeManifest(projectDir, manifest) {
  writeFileSync(join(projectDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

export function findEntry(manifest, cacheKey) {
  return manifest.entries.find(entry => entry.cache_key === cacheKey) ?? null
}

export function isEntryValid(entry, projectDir) {
  return existsSync(join(projectDir, entry.output))
}

export function addEntry(manifest, entry) {
  return {
    ...manifest,
    entries: [...manifest.entries, entry],
  }
}
