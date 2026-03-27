// skills/script-breakdown/scripts/validate-shot-list.js
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const SCHEMA_VERSION = '1.0'
const VALID_STATUSES = ['pending', 'generating', 'ready']

function validate(data) {
  if (data.$schemaVersion === undefined) throw new Error('Missing $schemaVersion')
  if (data.$schemaVersion !== SCHEMA_VERSION) throw new Error(`Unknown $schemaVersion: ${data.$schemaVersion}`)
  if (!data.chapterId || typeof data.chapterId !== 'string') throw new Error('Missing or invalid chapterId')
  if (!data.generatedAt || typeof data.generatedAt !== 'string') throw new Error('Missing generatedAt')
  if (!Array.isArray(data.shots)) throw new Error('shots must be an array')
  for (const [i, shot] of data.shots.entries()) {
    if (typeof shot.index !== 'number') throw new Error(`shots[${i}].index must be a number`)
    if (typeof shot.title !== 'string') throw new Error(`shots[${i}].title must be a string`)
    if (typeof shot.scriptExcerpt !== 'string') throw new Error(`shots[${i}].scriptExcerpt must be a string`)
    if (!Array.isArray(shot.characterNames)) throw new Error(`shots[${i}].characterNames must be an array`)
    if (!Array.isArray(shot.sceneNames)) throw new Error(`shots[${i}].sceneNames must be an array`)
    if (!VALID_STATUSES.includes(shot.status)) {
      throw new Error(`shots[${i}].status must be one of: ${VALID_STATUSES.join(', ')}`)
    }
  }
}

function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: { file: { type: 'string' } },
    strict: false,
  })
  if (!values.file) { process.stderr.write('Missing required flag: --file\n'); process.exit(1) }
  let data
  try { data = JSON.parse(readFileSync(values.file, 'utf8')) }
  catch (e) { process.stderr.write(`Failed to read file: ${e.message}\n`); process.exit(1) }
  try { validate(data); process.exit(0) }
  catch (e) { process.stderr.write(e.message + '\n'); process.exit(1) }
}

main()
