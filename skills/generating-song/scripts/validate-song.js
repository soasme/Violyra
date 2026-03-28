// skills/generating-song/scripts/validate-song.js
import { statSync } from 'node:fs'
import { extname } from 'node:path'
import { parseArgs } from 'node:util'

const VALID_EXTENSIONS = new Set(['.mp3', '.wav', '.flac', '.m4a', '.ogg'])

function validate(filePath) {
  let stat
  try { stat = statSync(filePath) }
  catch { throw new Error(`File not found: ${filePath}`) }
  const ext = extname(filePath).toLowerCase()
  if (!VALID_EXTENSIONS.has(ext))
    throw new Error(`Unsupported extension: ${ext}. Expected one of: ${[...VALID_EXTENSIONS].join(', ')}`)
  if (stat.size === 0) throw new Error(`File is empty: ${filePath}`)
}

function main() {
  const { values } = parseArgs({ args: process.argv.slice(2), options: { file: { type: 'string' } }, strict: false })
  if (!values.file) { process.stderr.write('Missing required flag: --file\n'); process.exit(1) }
  try { validate(values.file); process.exit(0) }
  catch (e) { process.stderr.write(e.message + '\n'); process.exit(1) }
}

main()
