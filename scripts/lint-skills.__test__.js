import { describe, it, expect } from 'vitest'
import { parseFrontmatter, lintSkillContent } from './lint-skills.js'

const VALID = '---\nname: writing-video-plan\ndescription: Use when writing a storyboard plan from lyrics, style, and visual requirements.\n---\n# Content\n\n## Logging\n\nLog to `{project_dir}/logs/production.jsonl`.'

describe('parseFrontmatter', () => {
  it('returns null when no frontmatter block', () => {
    expect(parseFrontmatter('# No frontmatter')).toBeNull()
  })
  it('parses name and description', () => {
    expect(parseFrontmatter(VALID)).toEqual({
      name: 'writing-video-plan',
      description: 'Use when writing a storyboard plan from lyrics, style, and visual requirements.',
    })
  })
  it('handles description with colons', () => {
    const c = '---\nname: foo-bar\ndescription: Use when: conditions apply\n---'
    expect(parseFrontmatter(c).description).toBe('Use when: conditions apply')
  })
  it('handles CRLF line endings', () => {
    const c = '---\r\nname: writing-video-plan\r\ndescription: A description.\r\n---\r\n# Content'
    expect(parseFrontmatter(c)).toEqual({ name: 'writing-video-plan', description: 'A description.' })
  })
})

describe('lintSkillContent', () => {
  it('returns no violations for a valid skill', () => {
    expect(lintSkillContent('writing-video-plan', VALID)).toEqual([])
  })
  it('reports missing frontmatter', () => {
    const v = lintSkillContent('writing-video-plan', '# No frontmatter')
    expect(v[0]).toMatch(/missing or malformed/)
  })
  it('reports missing name field', () => {
    const c = '---\ndescription: A description under 200 chars\n---'
    expect(lintSkillContent('writing-video-plan', c)[0]).toMatch(/missing 'name'/)
  })
  it('reports missing description field', () => {
    const c = '---\nname: writing-video-plan\n---'
    expect(lintSkillContent('writing-video-plan', c)[0]).toMatch(/missing 'description'/)
  })
  it('reports description over 200 chars', () => {
    const long = 'A'.repeat(201)
    const c = `---\nname: writing-video-plan\ndescription: ${long}\n---`
    const v = lintSkillContent('writing-video-plan', c)
    expect(v[0]).toMatch(/201 chars/)
  })
  it('reports name mismatch with directory', () => {
    const v = lintSkillContent('some-other-dir', VALID)
    expect(v[0]).toMatch(/does not match directory/)
  })
  it('reports name not following gerund-object pattern', () => {
    const c = '---\nname: VideoWriter\ndescription: A description\n---'
    expect(lintSkillContent('VideoWriter', c)[0]).toMatch(/gerund-object/)
  })
  it('accepts multi-word gerund-object names', () => {
    const c = '---\nname: writing-seedance15-prompt\ndescription: A description under 200 chars.\n---\n# Content\n\n## Logging\n\nLog here.'
    expect(lintSkillContent('writing-seedance15-prompt', c)).toEqual([])
  })
  it('reports missing ## Logging section', () => {
    const c = '---\nname: writing-video-plan\ndescription: A description.\n---\n# Content'
    expect(lintSkillContent('writing-video-plan', c)[0]).toMatch(/missing '## Logging'/)
  })
  it('reports ## Logging section not last', () => {
    const c = '---\nname: writing-video-plan\ndescription: A description.\n---\n# Content\n\n## Logging\n\nLog here.\n\n## Extra\n\nExtra content.'
    expect(lintSkillContent('writing-video-plan', c)[0]).toMatch(/'## Logging' section must be the final/)
  })
})
