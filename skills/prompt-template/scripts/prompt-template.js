// skills/prompt-template/scripts/prompt-template.js
import { join, resolve } from 'node:path'
import { rmSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import {
  SCHEMA_VERSION, generateId, readPack, writePack,
  errorExit, successOutput,
} from '../../lib/pack-utils.js'

function tmplPath(baseDir, id) { return join(resolve(baseDir), 'global', 'templates', id, 'template.json') }
function tmplDir(baseDir, id) { return join(resolve(baseDir), 'global', 'templates', id) }

// listPacksInDir expects pack.json; templates use template.json — use a custom lister
function listTemplatesInDir(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(e => {
      const p = join(dir, e.name, 'template.json')
      if (!existsSync(p)) return []
      try { return [JSON.parse(readFileSync(p, 'utf8'))] } catch { return [] }
    })
}

function create(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.name) errorExit('Missing required flag: --name')
  if (!v.category) errorExit('Missing required flag: --category')
  if (!v.content) errorExit('Missing required flag: --content')
  if (!v.variables) errorExit('Missing required flag: --variables')
  const id = generateId('tmpl')
  const now = new Date().toISOString()
  const tmpl = {
    $schemaVersion: SCHEMA_VERSION, id,
    category: v.category, name: v.name,
    preview: v.preview ?? '',
    content: v.content,
    variables: JSON.parse(v.variables),
    isDefault: v['is-default'] === true || v['is-default'] === 'true',
    isSystem: false,
    createdAt: now, updatedAt: now,
  }
  writePack(tmplPath(v['base-dir'], id), tmpl)
  successOutput(tmpl)
}

function read(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { successOutput(readPack(tmplPath(v['base-dir'], v.id))) }
  catch (e) { errorExit(e.message) }
}

function update(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  let tmpl
  try { tmpl = readPack(tmplPath(v['base-dir'], v.id)) }
  catch (e) { errorExit(e.message) }
  if (v.name !== undefined) tmpl.name = v.name
  if (v.content !== undefined) tmpl.content = v.content
  if (v.variables !== undefined) tmpl.variables = JSON.parse(v.variables)
  if (v.preview !== undefined) tmpl.preview = v.preview
  if (v['is-default'] !== undefined) tmpl.isDefault = v['is-default'] === true || v['is-default'] === 'true'
  tmpl.updatedAt = new Date().toISOString()
  writePack(tmplPath(v['base-dir'], v.id), tmpl)
  successOutput(tmpl)
}

function deleteTmpl(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  if (!v.id) errorExit('Missing required flag: --id')
  try { rmSync(tmplDir(v['base-dir'], v.id), { recursive: true, force: true }); successOutput({ id: v.id, deleted: true }) }
  catch (e) { errorExit(e.message) }
}

function list(v) {
  if (!v['base-dir']) errorExit('Missing required flag: --base-dir')
  let tmpls = listTemplatesInDir(join(resolve(v['base-dir']), 'global', 'templates'))
  if (v.filter) {
    const kw = v.filter.toLowerCase()
    tmpls = tmpls.filter(t => t.name.toLowerCase().includes(kw) || (t.preview ?? '').toLowerCase().includes(kw))
  }
  successOutput(tmpls)
}

function main() {
  const { values: v, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'base-dir': { type: 'string' }, name: { type: 'string' },
      category: { type: 'string' }, content: { type: 'string' },
      variables: { type: 'string' }, preview: { type: 'string' },
      'is-default': { type: 'string' }, id: { type: 'string' }, filter: { type: 'string' },
    },
    allowPositionals: true, strict: false,
  })
  const cmds = { create, read, update, delete: deleteTmpl, list }
  const [sub] = positionals
  if (!sub || !cmds[sub]) errorExit(`Unknown subcommand: ${sub ?? '(none)'}. Use: create|read|update|delete|list`)
  cmds[sub](v)
}

main()
