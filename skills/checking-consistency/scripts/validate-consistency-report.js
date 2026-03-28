// skills/consistency-check/scripts/validate-consistency-report.js
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const SCHEMA_VERSION = '1.0'
const VALID_ISSUE_TYPES = ['character_drift', 'scene_drift', 'prop_mismatch', 'costume_change_unintended', 'style_deviation']

function validate(data) {
  if (data.$schemaVersion === undefined) throw new Error('Missing $schemaVersion')
  if (data.$schemaVersion !== SCHEMA_VERSION) throw new Error(`Unknown $schemaVersion: ${data.$schemaVersion}`)
  if (!data.chapterId || typeof data.chapterId !== 'string') throw new Error('Missing chapterId')
  if (!data.generatedAt || typeof data.generatedAt !== 'string') throw new Error('Missing generatedAt')
  if (!Array.isArray(data.issues)) throw new Error('issues must be an array')
  for (const [i, issue] of data.issues.entries()) {
    if (!VALID_ISSUE_TYPES.includes(issue.type)) {
      throw new Error(`issues[${i}].type must be one of: ${VALID_ISSUE_TYPES.join(', ')}`)
    }
    if (!Array.isArray(issue.shotIndices)) throw new Error(`issues[${i}].shotIndices must be an array`)
    if (typeof issue.entityId !== 'string') throw new Error(`issues[${i}].entityId must be a string`)
    if (typeof issue.description !== 'string') throw new Error(`issues[${i}].description must be a string`)
    if (typeof issue.entityType !== 'string') throw new Error(`issues[${i}].entityType must be a string`)
    if (typeof issue.suggestion !== 'string') throw new Error(`issues[${i}].suggestion must be a string`)
  }
  // optimizedShotList is null or a shot-list-compatible object — just check it's not undefined
  if (!('optimizedShotList' in data)) throw new Error('Missing optimizedShotList (use null if no optimization)')
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
