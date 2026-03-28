// skills/retention-driven-development/scripts/validate-retention-report.js
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const SCHEMA_VERSION = '1.0'
const VALID_STATUSES = ['pass', 'fail']

function validate(data) {
  if (data.$schemaVersion === undefined) throw new Error('Missing $schemaVersion')
  if (data.$schemaVersion !== SCHEMA_VERSION) throw new Error(`Unknown $schemaVersion: ${data.$schemaVersion}`)
  if (!data.chapterId || typeof data.chapterId !== 'string') throw new Error('Missing chapterId')
  if (!data.generatedAt || typeof data.generatedAt !== 'string') throw new Error('Missing generatedAt')
  if (typeof data.threshold !== 'number') throw new Error('threshold must be a number')
  if (typeof data.iterations !== 'number') throw new Error('iterations must be a number')
  if (!Array.isArray(data.shotScores)) throw new Error('shotScores must be an array')
  for (const [i, shot] of data.shotScores.entries()) {
    if (typeof shot.shotIndex !== 'number') throw new Error(`shotScores[${i}].shotIndex must be a number`)
    if (typeof shot.score !== 'number' || shot.score < 0 || shot.score > 100)
      throw new Error(`shotScores[${i}].score must be a number between 0 and 100`)
    if (!VALID_STATUSES.includes(shot.status))
      throw new Error(`shotScores[${i}].status must be one of: ${VALID_STATUSES.join(', ')}`)
    if (typeof shot.regenerated !== 'boolean') throw new Error(`shotScores[${i}].regenerated must be a boolean`)
  }
  if (typeof data.passCount !== 'number') throw new Error('passCount must be a number')
  if (typeof data.failCount !== 'number') throw new Error('failCount must be a number')
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
