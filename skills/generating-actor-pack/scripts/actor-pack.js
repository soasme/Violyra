// skills/generating-actor-pack/scripts/actor-pack.js
import { join, resolve } from 'node:path'
import { rmSync, existsSync } from 'node:fs'
import { parseArgs } from 'node:util'
import {
  SCHEMA_VERSION, generateId, readPack, writePack,
  errorExit, successOutput, listPacksInDir, safeParseJson,
} from '../../lib/pack-utils.js'

function packPath(baseDir, id) {
  return join(resolve(baseDir), 'global', 'actors', id, 'pack.json')
}

function packDir(baseDir, id) {
  return join(resolve(baseDir), 'global', 'actors', id)
}

function create(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.name) errorExit('Missing required flag: --name')
  const id = generateId('actor')
  const now = new Date().toISOString()
  const pack = {
    $schemaVersion: SCHEMA_VERSION, id,
    name: v.name,
    description: v.description ?? '',
    appearance: v.appearance ?? '',
    tags: v.tags ? safeParseJson(v.tags, '--tags') : [],
    viewCount: 1, promptTemplateId: null, images: [],
    createdAt: now, updatedAt: now,
  }
  writePack(packPath(v['base-dir'], id), pack)
  successOutput(pack)
}

function read(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { successOutput(readPack(packPath(v['base-dir'], v.id))) }
  catch (e) { errorExit(e.message) }
}

function update(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  let pack
  try { pack = readPack(packPath(v['base-dir'], v.id)) }
  catch (e) { errorExit(e.message) }
  if (v.name !== undefined) pack.name = v.name
  if (v.description !== undefined) pack.description = v.description
  if (v.appearance !== undefined) pack.appearance = v.appearance
  if (v.tags !== undefined) pack.tags = safeParseJson(v.tags, '--tags')
  pack.updatedAt = new Date().toISOString()
  writePack(packPath(v['base-dir'], v.id), pack)
  successOutput(pack)
}

function deletePack(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  if (!existsSync(packDir(v['base-dir'], v.id))) errorExit(`Pack not found: ${v.id}`)
  try {
    rmSync(packDir(v['base-dir'], v.id), { recursive: true })
    successOutput({ id: v.id, deleted: true })
  } catch (e) { errorExit(e.message) }
}

function list(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  let packs = listPacksInDir(join(resolve(v['base-dir']), 'global', 'actors'))
  if (v.filter) {
    const kw = v.filter.toLowerCase()
    packs = packs.filter(p =>
      p.name.toLowerCase().includes(kw) || (p.description ?? '').toLowerCase().includes(kw)
    )
  }
  successOutput(packs)
}

function main() {
  const { values: v, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'base-dir': { type: 'string' }, name: { type: 'string' },
      description: { type: 'string' }, appearance: { type: 'string' },
      tags: { type: 'string' }, id: { type: 'string' }, filter: { type: 'string' },
    },
    allowPositionals: true, strict: false,
  })
  const cmds = { create, read, update, delete: deletePack, list }
  const [sub] = positionals
  if (!sub || !cmds[sub]) errorExit(`Unknown subcommand: ${sub ?? '(none)'}. Use: create|read|update|delete|list`)
  cmds[sub](v)
}

main()
