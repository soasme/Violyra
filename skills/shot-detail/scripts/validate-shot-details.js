// skills/shot-detail/scripts/validate-shot-details.js
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const SCHEMA_VERSION = '1.0'
const CAMERA_SHOTS = ['ECU', 'CU', 'MCU', 'MS', 'MLS', 'LS', 'ELS']
const ANGLES = ['EYE_LEVEL', 'HIGH_ANGLE', 'LOW_ANGLE', 'BIRD_EYE', 'DUTCH', 'OVER_SHOULDER']
const MOVEMENTS = ['STATIC', 'PAN', 'TILT', 'DOLLY_IN', 'DOLLY_OUT', 'TRACK', 'CRANE', 'HANDHELD', 'STEADICAM', 'ZOOM_IN', 'ZOOM_OUT']
const VFX_TYPES = ['NONE', 'PARTICLES', 'VOLUMETRIC_FOG', 'CG_DOUBLE', 'DIGITAL_ENVIRONMENT', 'MATTE_PAINTING', 'FIRE_SMOKE', 'WATER_SIM', 'DESTRUCTION', 'ENERGY_MAGIC', 'COMPOSITING_CLEANUP', 'SLOW_MOTION_TIME', 'OTHER']

function validate(data) {
  if (data.$schemaVersion === undefined) throw new Error('Missing $schemaVersion')
  if (data.$schemaVersion !== SCHEMA_VERSION) throw new Error(`Unknown $schemaVersion: ${data.$schemaVersion}`)
  if (!data.chapterId || typeof data.chapterId !== 'string') throw new Error('Missing chapterId')
  if (!data.generatedAt || typeof data.generatedAt !== 'string') throw new Error('Missing generatedAt')
  if (!Array.isArray(data.details)) throw new Error('details must be an array')
  for (const [i, d] of data.details.entries()) {
    if (typeof d.shotIndex !== 'number') throw new Error(`details[${i}].shotIndex must be a number`)
    if (!CAMERA_SHOTS.includes(d.cameraShot)) throw new Error(`details[${i}].cameraShot must be one of: ${CAMERA_SHOTS.join(', ')}`)
    if (!ANGLES.includes(d.angle)) throw new Error(`details[${i}].angle must be one of: ${ANGLES.join(', ')}`)
    if (!MOVEMENTS.includes(d.movement)) throw new Error(`details[${i}].movement must be one of: ${MOVEMENTS.join(', ')}`)
    if (!Array.isArray(d.sceneIds)) throw new Error(`details[${i}].sceneIds must be an array`)
    if (!Number.isInteger(d.duration)) throw new Error(`details[${i}].duration must be an integer`)
    if (!Array.isArray(d.moodTags)) throw new Error(`details[${i}].moodTags must be an array`)
    if (typeof d.followAtmosphere !== 'boolean') throw new Error(`details[${i}].followAtmosphere must be a boolean`)
    if (!VFX_TYPES.includes(d.vfxType)) throw new Error(`details[${i}].vfxType must be one of: ${VFX_TYPES.join(', ')}`)
    if (!Array.isArray(d.dialogLines)) throw new Error(`details[${i}].dialogLines must be an array`)
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
