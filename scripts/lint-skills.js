import { readdirSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  const fm = {}
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim()
    if (key) fm[key] = val
  }
  return fm
}

export function lintSkillContent(dirName, content) {
  const violations = []
  const fm = parseFrontmatter(content)
  if (!fm) {
    violations.push(`${dirName}: missing or malformed YAML frontmatter`)
    return violations
  }
  if (!fm.name) violations.push(`${dirName}: missing 'name' field in frontmatter`)
  if (!fm.description) violations.push(`${dirName}: missing 'description' field in frontmatter`)
  if (fm.description && fm.description.length > 200) {
    violations.push(`${dirName}: description is ${fm.description.length} chars (max 200)`)
  }
  if (fm.name && fm.name !== dirName) {
    violations.push(`${dirName}: name '${fm.name}' does not match directory name '${dirName}'`)
  }
  if (fm.name && !/^[a-z]+-[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.name)) {
    violations.push(`${dirName}: name '${fm.name}' does not follow gerund-object pattern`)
  }
  return violations
}

function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const skillsDir = join(__dirname, '..', 'skills')
  const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'lib')
    .map(d => d.name)
  const allViolations = []
  for (const dir of skillDirs) {
    const skillPath = join(skillsDir, dir, 'SKILL.md')
    let content
    try {
      content = readFileSync(skillPath, 'utf8')
    } catch {
      allViolations.push(`${dir}: SKILL.md not found`)
      continue
    }
    allViolations.push(...lintSkillContent(dir, content))
  }
  if (allViolations.length > 0) {
    for (const v of allViolations) console.error(v)
    process.exit(1)
  }
  console.log(`✓ ${skillDirs.length} skills passed linting`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
