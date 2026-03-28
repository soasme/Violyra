// skills/extracting-video-entities/scripts/validate-extraction-report.js
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const SCHEMA_VERSION = '1.0'

function validate(data) {
  if (data.$schemaVersion === undefined) throw new Error('Missing $schemaVersion')
  if (data.$schemaVersion !== SCHEMA_VERSION) throw new Error(`Unknown $schemaVersion: ${data.$schemaVersion}`)
  if (!data.chapterId || typeof data.chapterId !== 'string') throw new Error('Missing or invalid chapterId')
  if (!data.generatedAt || typeof data.generatedAt !== 'string') throw new Error('Missing generatedAt')
  if (!Array.isArray(data.shotEntityRefs)) throw new Error('shotEntityRefs must be an array')
  for (const [i, ref] of data.shotEntityRefs.entries()) {
    if (!Number.isInteger(ref.shotIndex)) throw new Error(`shotEntityRefs[${i}].shotIndex must be an integer`)
    for (const field of ['actorIds', 'characterIds', 'sceneIds', 'propIds', 'costumeIds']) {
      if (!Array.isArray(ref[field])) throw new Error(`shotEntityRefs[${i}].${field} must be an array`)
      if (!ref[field].every(id => typeof id === 'string')) throw new Error(`shotEntityRefs[${i}].${field} must be an array of strings`)
    }
  }
  if (!data.newEntities || typeof data.newEntities !== 'object') throw new Error('Missing newEntities')
  for (const field of ['actors', 'scenes', 'props', 'costumes']) {
    if (!Array.isArray(data.newEntities[field])) throw new Error(`newEntities.${field} must be an array`)
    if (!data.newEntities[field].every(id => typeof id === 'string')) throw new Error(`newEntities.${field} must be an array of strings`)
  }
}

function main() {
  const { values } = parseArgs({ args: process.argv.slice(2), options: { file: { type: 'string' } }, strict: false })
  if (!values.file) { process.stderr.write('Missing required flag: --file\n'); process.exit(1) }
  let data
  try { data = JSON.parse(readFileSync(values.file, 'utf8')) }
  catch (e) { process.stderr.write(`Failed to read file: ${e.message}\n`); process.exit(1) }
  try { validate(data); process.exit(0) }
  catch (e) { process.stderr.write(e.message + '\n'); process.exit(1) }
}

main()
